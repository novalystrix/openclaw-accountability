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

## Key Design Principles

- **Read before acting**: Agent MUST read the full item document before doing any work (prevents contradicting prior decisions)
- **Sub-agents get full context**: Every spawned sub-agent receives the complete item doc in its prompt
- **Owner controls completion**: Only the task assigner can mark Roy-assigned tasks as Done
- **Verify, don't assume**: Items with URLs must be browser-tested before reporting success
- **Respect messaging hours**: No messaging people outside 8AM-10PM (configurable timezone)

## Plugin Structure

```
├── openclaw.plugin.json    # Plugin manifest + config schema
├── index.ts                # Plugin entry point, registers tools
├── src/
│   ├── monday.ts           # Monday.com GraphQL API client
│   ├── work-session.ts     # Hourly work session orchestration
│   ├── verification.ts     # Browser-based verification helpers
│   └── config.ts           # Plugin configuration types
├── skills/
│   └── accountability/
│       └── SKILL.md        # Agent instructions for work sessions
├── package.json
└── tsconfig.json
```

## Agent Tools Provided

| Tool | Description |
|------|-------------|
| `accountability_list` | List all active items with sub-items and recent updates |
| `accountability_create_item` | Create a new accountability item |
| `accountability_create_subtask` | Create a subtask under an item |
| `accountability_update` | Write an update to an item |
| `accountability_set_status` | Change item status (enforces completion rules) |
| `accountability_verify` | Open URL in browser and screenshot for verification |

## Install

```bash
# Clone into OpenClaw plugins directory
git clone git@github.com:novalystrix/openclaw-accountability.git
cd openclaw-accountability
npm install
npm run build

# Add to openclaw.json
# plugins.entries.accountability.enabled = true
# plugins.entries.accountability.config.mondayApiToken = "..."
# plugins.entries.accountability.config.boardId = 5092401929
```

## Config

```json
{
  "plugins": {
    "entries": {
      "accountability": {
        "enabled": true,
        "config": {
          "mondayApiToken": "your-monday-api-token",
          "boardId": 5092401929,
          "timezone": "Asia/Jerusalem",
          "messagingHours": { "start": 8, "end": 22 },
          "workSessionInterval": "1h",
          "completionRules": {
            "ownerOnly": true
          }
        }
      }
    }
  }
}
```

## Lessons Learned (Why This Exists)

This plugin was born from real failures:

1. **Isolated agents lack context** — Without the full item doc, a sub-agent recreated a Telegram bot that had been explicitly deleted. Now every sub-agent gets the complete context.
2. **Status checks ≠ work** — Health checking a URL isn't the same as testing the full user flow. The plugin enforces browser verification for URL-based items.
3. **Markdown skills are fragile** — A SKILL.md that says "read the doc first" gets skipped. Plugin code enforces the workflow.
4. **Completion rules need enforcement** — The agent kept marking things "Done" that weren't. Now it's code: Roy-assigned items can only be suggested as complete.

## License

MIT
