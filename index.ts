import { Type } from "@sinclair/typebox";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import {
  listActiveItems,
  createItem,
  createSubitem,
  writeUpdate,
  setLastChecked,
  setStatus,
  type MondayConfig,
} from "./src/monday.js";

export default function (api: OpenClawPluginApi) {
  const getConfig = (): MondayConfig => {
    const cfg = api.getConfig() as any;
    return {
      apiToken: cfg.mondayApiToken,
      boardId: cfg.boardId,
      columns: {
        status: cfg.columns?.status ?? "color_mm0yr4nm",
        checkFrequency: cfg.columns?.checkFrequency ?? "text_mm0y6b8r",
        lastChecked: cfg.columns?.lastChecked ?? "date_mm0y8p9j",
        details: cfg.columns?.details ?? "long_text_mm0yce5e",
        assignedBy: cfg.columns?.assignedBy ?? "color_mm10z99x",
      },
    };
  };

  // --- Tool: List all active accountability items ---
  api.registerTool({
    name: "accountability_list",
    description:
      "List all active accountability items from Monday.com board, including sub-items, recent updates, details/doc column, and assigned-by info. ALWAYS call this first in a work session before doing any work.",
    parameters: Type.Object({}),
    async execute() {
      const items = await listActiveItems(getConfig());
      return {
        content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      };
    },
  });

  // --- Tool: Create a new accountability item ---
  api.registerTool({
    name: "accountability_create_item",
    description:
      "Create a new accountability item on the Monday.com board. Set assignedBy to 'Roy' for owner-assigned tasks (only owner can mark Done) or 'Nova' for self-assigned tasks.",
    parameters: Type.Object({
      name: Type.String({ description: "Item title" }),
      details: Type.String({ description: "Full details: goal, definition of done, constraints, what NOT to do" }),
      assignedBy: Type.Union([Type.Literal("Roy"), Type.Literal("Nova")], { description: "Who assigned this task" }),
    }),
    async execute(_id, params) {
      const id = await createItem(getConfig(), params.name, params.details, params.assignedBy);
      return {
        content: [{ type: "text", text: `Created item ${id}: ${params.name}` }],
      };
    },
  });

  // --- Tool: Create a subtask under an item ---
  api.registerTool({
    name: "accountability_create_subtask",
    description:
      "Create a subtask (sub-item) under an accountability item. Use this to break work into specific actionable units. Write the plan in the details field before executing.",
    parameters: Type.Object({
      parentId: Type.String({ description: "Parent item ID" }),
      name: Type.String({ description: "Subtask title" }),
      details: Type.Optional(Type.String({ description: "Plan: what you're about to do, approach, expected outcome" })),
    }),
    async execute(_id, params) {
      const id = await createSubitem(getConfig(), params.parentId, params.name, params.details);
      return {
        content: [{ type: "text", text: `Created subtask ${id}: ${params.name}` }],
      };
    },
  });

  // --- Tool: Write an update to an item ---
  api.registerTool({
    name: "accountability_update",
    description:
      "Write a progress update to an accountability item's Updates section on Monday.com. Use HTML formatting. Write updates after completing work, hitting blockers, or changing approach.",
    parameters: Type.Object({
      itemId: Type.String({ description: "Item ID to update" }),
      body: Type.String({ description: "Update content in HTML (e.g. <p>Did X. Result: Y.</p>)" }),
    }),
    async execute(_id, params) {
      const id = await writeUpdate(getConfig(), params.itemId, params.body);
      return {
        content: [{ type: "text", text: `Update ${id} written to item ${params.itemId}` }],
      };
    },
  });

  // --- Tool: Set item status (with completion rules) ---
  api.registerTool({
    name: "accountability_set_status",
    description:
      "Change an accountability item's status. ENFORCES COMPLETION RULES: If the item is assigned by Roy, you CANNOT set status to 'Done' — use 'suggest_done' instead which writes an update suggesting completion without changing status. Only 'Working on it', 'Stuck', or 'suggest_done' are allowed for Roy-assigned items.",
    parameters: Type.Object({
      itemId: Type.String({ description: "Item ID" }),
      status: Type.Union(
        [
          Type.Literal("Working on it"),
          Type.Literal("Done"),
          Type.Literal("Stuck"),
          Type.Literal("suggest_done"),
        ],
        { description: "New status. Use 'suggest_done' for Roy-assigned items you think are complete." }
      ),
    }),
    async execute(_id, params) {
      const config = getConfig();

      if (params.status === "suggest_done") {
        await writeUpdate(config, params.itemId,
          "<p><strong>✅ Suggesting completion</strong> — This item appears to meet its definition of done. Waiting for owner confirmation to mark as Done.</p>"
        );
        return {
          content: [{ type: "text", text: `Suggested completion for item ${params.itemId}. Owner must confirm.` }],
        };
      }

      if (params.status === "Done") {
        // Check if Roy-assigned
        const items = await listActiveItems(config);
        const item = items.find(i => i.id === params.itemId);
        if (item?.assignedBy === "Roy") {
          return {
            content: [{
              type: "text",
              text: `BLOCKED: Item ${params.itemId} is assigned by Roy. Cannot mark as Done. Use status='suggest_done' instead.`,
            }],
          };
        }
      }

      await setStatus(config, params.itemId, params.status as any);
      return {
        content: [{ type: "text", text: `Status of item ${params.itemId} set to: ${params.status}` }],
      };
    },
  });

  // --- Tool: Update last checked date ---
  api.registerTool({
    name: "accountability_checked",
    description: "Update the 'Last Checked' date on an accountability item to today.",
    parameters: Type.Object({
      itemId: Type.String({ description: "Item ID" }),
    }),
    async execute(_id, params) {
      const today = new Date().toISOString().split("T")[0];
      await setLastChecked(getConfig(), params.itemId, today);
      return {
        content: [{ type: "text", text: `Last checked updated to ${today} for item ${params.itemId}` }],
      };
    },
  });
}
