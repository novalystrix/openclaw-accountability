/**
 * Work-session orchestration helpers.
 *
 * These are pure functions used by tools and skills to decide what to work
 * on, whether to send messages, and how to brief sub-agents.
 */

import type { AccountabilityItem } from "./monday.js";

// ---------------------------------------------------------------------------
// Messaging hours
// ---------------------------------------------------------------------------

/**
 * Returns true if the current wall-clock time in `tz` falls within [start, end).
 *
 * @param tz    - IANA timezone string, e.g. "Asia/Jerusalem"
 * @param start - 24-hour "HH:MM" string for the start of the window (inclusive)
 * @param end   - 24-hour "HH:MM" string for the end of the window (exclusive)
 */
export function isWithinMessagingHours(
  tz: string,
  start: string,
  end: string
): boolean {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const current = `${hour}:${minute}`;
  return current >= start && current < end;
}

// ---------------------------------------------------------------------------
// Priority assessment
// ---------------------------------------------------------------------------

export type Priority = "urgent" | "high" | "normal" | "low";

/**
 * Assess the priority of a single accountability item based on its current
 * state, who assigned it, and how overdue it is for a check.
 *
 * Priority scale:
 *  - urgent: stuck / blocking
 *  - high:   owner-assigned (Roy) or overdue per check frequency
 *  - normal: self-assigned, within schedule
 *  - low:    done or explicitly deprioritised
 */
export function assessItemPriority(item: AccountabilityItem, ownerName = "Owner"): Priority {
  if (item.status === "Stuck") return "urgent";
  if (item.status === "Done") return "low";

  const daysSinceCheck: number = item.lastChecked
    ? Math.floor(
        (Date.now() - new Date(item.lastChecked).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : Infinity;

  const freq = (item.checkFrequency ?? "").toLowerCase();

  if (freq.includes("daily") && daysSinceCheck >= 1) return "high";
  if (freq.includes("weekly") && daysSinceCheck >= 7) return "high";
  if (freq.includes("biweekly") && daysSinceCheck >= 14) return "high";
  if (daysSinceCheck === Infinity) return "high"; // never checked

  if (item.assignedBy === ownerName) return "high";

  return "normal";
}

// ---------------------------------------------------------------------------
// Sub-agent prompt builder
// ---------------------------------------------------------------------------

/**
 * Build a complete, self-contained prompt to hand off to a sub-agent that
 * will work on a single accountability item.
 *
 * The prompt includes:
 *  - Full item metadata and status
 *  - The details / definition-of-done column verbatim
 *  - All sub-tasks with their current status
 *  - Recent updates (most recent first) for context on prior work
 *  - Completion rules (Roy-assigned items require owner sign-off)
 *  - Step-by-step operating instructions
 */
export function buildSubAgentPrompt(item: AccountabilityItem, ownerName = "Owner"): string {
  const lines: string[] = [];

  lines.push("# Accountability Work Session");
  lines.push("");
  lines.push("## Item Metadata");
  lines.push(`- **ID**: ${item.id}`);
  lines.push(`- **Name**: ${item.name}`);
  lines.push(`- **Status**: ${item.status ?? "Not set"}`);
  lines.push(`- **Assigned By**: ${item.assignedBy ?? "Unknown"}`);
  lines.push(`- **Check Frequency**: ${item.checkFrequency ?? "Not set"}`);
  lines.push(`- **Last Checked**: ${item.lastChecked ?? "Never"}`);

  // Details / definition of done — the most important context
  lines.push("");
  lines.push("## Details / Definition of Done");
  if (item.details) {
    lines.push(item.details);
  } else {
    lines.push(
      "_No details provided. Infer the goal from the item name and updates below._"
    );
  }

  // Sub-tasks
  if (item.subitems.length > 0) {
    lines.push("");
    lines.push("## Sub-tasks");
    for (const sub of item.subitems) {
      const status = sub.status ? `[${sub.status}]` : "[?]";
      const detail = sub.details ? ` — ${sub.details}` : "";
      lines.push(`- ${status} **${sub.name}** (ID: ${sub.id})${detail}`);
    }
  }

  // Recent updates for continuity
  if (item.updates.length > 0) {
    lines.push("");
    lines.push("## Recent Updates (most recent first)");
    for (const update of item.updates) {
      lines.push(`### ${update.createdAt}`);
      lines.push(update.body);
      lines.push("");
    }
  }

  // Completion rules — enforced at tool level but must be in the prompt too
  lines.push("");
  lines.push("## Completion Rules");
  if (item.assignedBy === ownerName) {
    lines.push(
      `> ⚠️ **This item is assigned by ${ownerName}.** You CANNOT mark it as Done.`
    );
    lines.push(
      "> When work appears complete, use `accountability_set_status` with `status: \"suggest_done\"`."
    );
    lines.push(`> ${ownerName} must review and confirm before it can be closed.`);
  } else {
    lines.push(
      "This item is self-assigned. You may mark it Done once the definition of done is met and you have verified the outcome."
    );
  }

  // Operating instructions
  lines.push("");
  lines.push("## Operating Instructions");
  lines.push(
    "1. **Read the Details section above in full** before taking any action."
  );
  lines.push(
    "2. **Create sub-tasks** (`accountability_create_subtask`) for each step you plan to take. Write the plan in the `details` field before executing."
  );
  lines.push(
    "3. **Verify URLs** by opening them in a browser and walking the full user flow — do not just ping the endpoint."
  );
  lines.push(
    "4. **Write an update** (`accountability_update`) after completing work, hitting a blocker, or changing approach. Include what you did, the result, and any evidence."
  );
  lines.push(
    "5. **Do not assume work is done** — confirm with evidence (screenshot, test output, log line)."
  );
  lines.push(
    "6. **Write code via Claude Code** — never write code inline in an update or prompt; invoke Claude Code for implementation tasks."
  );

  return lines.join("\n");
}
