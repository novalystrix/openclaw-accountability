---
name: accountability
description: Manage accountability items on Monday.com board "Nova Accountability". Use when creating new accountability items, checking on existing ones, running work sessions, or when a cron job fires. Also use when Roy says "you're accountable for X" or asks about accountability status.
---

# Accountability Skill

## Board Info
- **Board ID**: 5092401929
- **Board name**: Nova Accountability
- **Workspace**: nova-ops.monday.com

## Columns
| Column | ID | Type | Purpose |
|--------|-----|------|---------|
| Status | `color_mm0yr4nm` | status | Active / Done / Blocked |
| Check Frequency | `text_mm0y6b8r` | text | How often to check: 1h, 2h, 4h, 8h, daily |
| Last Checked | `date_mm0y8p9j` | date | When Nova last reviewed this item |
| Details | `long_text_mm0yce5e` | long_text | Full definition of what "done" means, context, blockers |
| Assigned By | `color_mm10z99x` | status | Who created/assigned this task. Labels: Roy (1), Nova (2) |

## Completion Rules
- **Roy-assigned tasks**: Only Roy can mark them Done. Nova may suggest completion but must NOT change status to Done.
- **Nova-assigned tasks**: Nova can mark them Done independently.
- Always check "Assigned By" before changing any status to Done.

## API Setup
- Token env var: `MONDAY_API_TOKEN` in `~/.openclaw/.env`
- Endpoint: `https://api.monday.com/v2` (GraphQL)
- Auth header: `Authorization: <token>`

---

## Hourly Work Session (Cron-Triggered)

This is the core loop. Every hour, a cron job fires and Nova runs a **real work session** — not just a status check.

### Phase 1: Review & Plan
1. **Read all active items** from the Monday board (including sub-items)
2. **Assess each item**: What's the current state? What changed since last check? What's blocking progress?
3. **Pick what to work on** — prioritize items that are unblocked and can make real progress
4. **Break work into subtasks** — create sub-items under the main accountability item on Monday
5. **Write the plan in the Doc column** of the sub-item: what you're about to do, approach, expected outcome

### Phase 2: Do the Work
6. **Execute the plan**:
   - For **code work**: Follow the product-dev process — Claude Code writes code, test, iterate. Never code directly.
   - For **non-code work**: Do it directly (config changes, research, outreach, etc.)
7. **Write an update** on the main accountability item in Monday (Updates section) with what was done and results

### Phase 3: Handle Being Stuck
If stuck, blocked, or unsure what to do next:

8. **Reassess the whole project fresh** — don't keep banging on the same approach
9. **If it's code**: Read ALL of it. Understand the goal. Reflect on everything as if seeing it for the first time.
10. **Create new tasks** as needed (sub-items on Monday)
11. **Orchestrate others**:
    - **Sub-agents**: Spawn Claude Code or other coding agents for implementation
    - **People**: Message anyone who can help — Roy, Oran, Maya, or others via WhatsApp. Don't limit yourself to Roy. If someone else has the context or ability to unblock you, reach out to them directly.
12. **If you genuinely need Roy**: Message him with specific context — what you tried, what failed, what you need from him

### Phase 4: Wrap Up
13. **Update "Last Checked"** date on all reviewed items
14. **Update statuses**: Move items to Blocked/Stuck if appropriate
15. **For Roy-assigned items that look complete**: Write an update suggesting it's done, but do NOT change status to Done — only Roy can do that

---

## Workflow: Creating New Accountability Items

1. Create item on board 5092401929 with `create_item` mutation
2. Set Details column with: goal, definition of done, current state
3. Set Check Frequency (e.g. "1h")
4. Set Assigned By: "Roy" or "Nova" depending on who initiated it
5. Write first update with current status
6. The hourly work session cron handles all items — no need for per-item crons

## Workflow: Daily Summary

Every day at 9:00 AM, review all active items and write a consolidated update to Roy.

---

## Monday.com Sub-Items

Sub-items are used as subtasks under each accountability item. They represent specific work units.

### Create sub-item
```graphql
mutation { create_subitem(parent_item_id: PARENT_ID, item_name: "SUBTASK_NAME", column_values: "{\"long_text_mm0yce5e\":{\"text\":\"PLAN\"}}") { id } }
```

### Read sub-items
```graphql
{ items(ids: [PARENT_ID]) { subitems { id name column_values { id text value } } } }
```

---

## GraphQL Snippets

### Read all active items (with sub-items)
```graphql
{ boards(ids: 5092401929) { items_page(limit: 50) { items { id name column_values { id text value } updates(limit: 3) { body created_at } subitems { id name column_values { id text value } } } } } }
```

### Create item
```graphql
mutation { create_item(board_id: 5092401929, item_name: "TITLE", column_values: "{\"long_text_mm0yce5e\":{\"text\":\"DETAILS\"},\"text_mm0y6b8r\":\"FREQ\",\"color_mm10z99x\":{\"label\":\"Roy\"}}") { id } }
```

### Write update
```graphql
mutation { create_update(item_id: ITEM_ID, body: "<p>UPDATE_HTML</p>") { id } }
```

### Update Last Checked
```graphql
mutation { change_column_value(board_id: 5092401929, item_id: ITEM_ID, column_id: "date_mm0y8p9j", value: "{\"date\":\"YYYY-MM-DD\"}") { id } }
```

### Change Status
Status labels: Working on it (1/orange), Done (2/green), Stuck (0/red)
```graphql
mutation { change_column_value(board_id: 5092401929, item_id: ITEM_ID, column_id: "color_mm0yr4nm", value: "{\"label\":\"Working on it\"}") { id } }
```

## Helper Script
Run `scripts/monday-api.sh` for common operations:
```bash
# List items
bash scripts/monday-api.sh list
# Add update to item
bash scripts/monday-api.sh update <item_id> "<html body>"
# Set last checked
bash scripts/monday-api.sh checked <item_id>
```

---

## Messaging Etiquette
- **Never message people outside 8:00 AM – 10:00 PM** (Asia/Jerusalem) unless it's genuinely urgent
- If you need someone's input and it's outside hours, note it as a blocker and follow up when hours resume
- Roy is the exception — he can be messaged anytime if something is truly urgent

## Critical: Read Before Working
**Before doing ANY work on an accountability item, you MUST read the full Document/Details column on that item first.** This contains important context, constraints, and explicit instructions about what to do and what NOT to do. Skipping this step has caused the agent to undo previous decisions. No exceptions.

## Sub-Agent Context Rule
**When spawning any sub-agent for work on an accountability item, you MUST include the full text from the item's Details/Doc column in the sub-agent's task prompt.** This includes constraints, warnings, history, and explicit "DO NOT" instructions. The sub-agent has no memory of previous sessions — if it doesn't get the context in its prompt, it will make decisions that contradict prior decisions. This is what caused the Telegram bot incident.
