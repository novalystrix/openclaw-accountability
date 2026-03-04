# openclaw-accountability

OpenClaw plugin for autonomous accountability work sessions with Monday.com integration.

## What This Does

An OpenClaw plugin that turns your agent into an autonomous worker. Every hour (configurable), the agent:

1. **Reviews** all active accountability items from Monday.com
2. **Plans** work by creating subtasks on the board
3. **Executes** — spawning coding agents, running tests, making config changes
4. **Verifies** — opens browsers, screenshots, tests end-to-end
5. **Updates** — writes progress to Monday.com
6. **Escalates** — messages people when stuck (respecting hours)

## Install

```bash
# Clone into your OpenClaw plugins directory
git clone <repo-url> openclaw-accountability
cd openclaw-accountability
npm install
```

Register the plugin in your `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "accountability": {
        "enabled": true,
        "path": "./plugins/openclaw-accountability",
        "config": {
          "mondayApiToken": "your-monday-api-token",
          "boardId": 123456789
        }
      }
    }
  }
}
```

## Configuration

All config lives under `plugins.entries.accountability.config` in `openclaw.json`.

### Required

| Key | Type | Description |
|-----|------|-------------|
| `mondayApiToken` | string | Your Monday.com API token |
| `boardId` | integer | Monday.com board ID to use |

### Optional

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ownerName` | string | `"Owner"` | Display name of the task owner (used in completion rules and tool descriptions) |
| `agentName` | string | `"Agent"` | Display name of the agent (used in tool descriptions) |
| `timezone` | string | `"Asia/Jerusalem"` | IANA timezone for messaging hours |
| `messagingHours.start` | integer | `8` | Hour (0-23) messaging window opens |
| `messagingHours.end` | integer | `22` | Hour (0-23) messaging window closes |
| `workSessionInterval` | string | `"1h"` | How often work sessions run |
| `completionRules.ownerOnly` | boolean | `true` | Only owner can mark owner-assigned items Done |

### Column Mapping

If your Monday.com board uses different column IDs, override them:

| Key | Default | Description |
|-----|---------|-------------|
| `columns.status` | `"color_mm0yr4nm"` | Status column ID |
| `columns.checkFrequency` | `"text_mm0y6b8r"` | Check frequency column ID |
| `columns.lastChecked` | `"date_mm0y8p9j"` | Last checked date column ID |
| `columns.details` | `"long_text_mm0yce5e"` | Details/doc column ID |
| `columns.assignedBy` | `"color_mm10z99x"` | Assigned-by column ID |

### Full Example

```json
{
  "plugins": {
    "entries": {
      "accountability": {
        "enabled": true,
        "path": "./plugins/openclaw-accountability",
        "config": {
          "mondayApiToken": "ey...",
          "boardId": 123456789,
          "ownerName": "Alice",
          "agentName": "Nova",
          "timezone": "America/New_York",
          "messagingHours": { "start": 9, "end": 21 },
          "workSessionInterval": "2h",
          "completionRules": { "ownerOnly": true },
          "columns": {
            "status": "status",
            "checkFrequency": "text0",
            "lastChecked": "date0",
            "details": "long_text",
            "assignedBy": "status_1"
          }
        }
      }
    }
  }
}
```

## Agent Tools Provided

| Tool | Description |
|------|-------------|
| `accountability_list` | List all active items with sub-items and recent updates |
| `accountability_create_item` | Create a new accountability item |
| `accountability_create_subtask` | Create a subtask under an item |
| `accountability_update` | Write an update to an item |
| `accountability_set_status` | Change item status (enforces completion rules) |
| `accountability_checked` | Update the "Last Checked" date to today |

## Usage

Once installed and configured, the agent uses the `accountability` skill automatically during work sessions. The skill instructs the agent to:

1. **Read all active items** from the board before doing anything
2. **Assess priority** — stuck items first, then owner-assigned, then overdue
3. **Work on items** — create subtasks, execute, write updates
4. **Respect completion rules** — owner-assigned items can only be _suggested_ as done
5. **Update timestamps** — mark items as checked after review

### Completion Rules

- Items assigned by `ownerName` cannot be marked Done by the agent. The agent uses `suggest_done` status instead, which writes an update suggesting completion.
- Items assigned by `agentName` (self-assigned) can be marked Done directly.

## Plugin Structure

```
├── openclaw.plugin.json    # Plugin manifest + config schema
├── index.ts                # Plugin entry point, registers tools
├── src/
│   ├── monday.ts           # Monday.com GraphQL API client
│   ├── work-session.ts     # Work session orchestration helpers
│   ├── verification.ts     # Browser-based verification helpers
│   └── types.ts            # Ambient type declarations
├── skills/
│   └── accountability/
│       └── SKILL.md        # Agent instructions for work sessions
├── package.json
└── tsconfig.json
```

## Helper Script

`scripts/monday-api.sh` provides CLI access to common board operations:

```bash
# Set BOARD_ID env var (or it reads from plugin config)
export BOARD_ID=123456789

bash scripts/monday-api.sh list
bash scripts/monday-api.sh update <item_id> "<html body>"
bash scripts/monday-api.sh checked <item_id>
```

## License

MIT
