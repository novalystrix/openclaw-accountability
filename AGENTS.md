# OpenClaw Accountability Plugin

## What This Is
An OpenClaw plugin that provides structured agent tools for accountability work sessions with Monday.com integration.

## Current State
- Initial scaffold exists: index.ts, src/monday.ts, openclaw.plugin.json, package.json, tsconfig.json
- Skills copied from working accountability skill
- NOT YET: src/verification.ts, src/work-session.ts, tests

## What Needs Building

### 1. src/verification.ts
Browser-based verification helpers. When an accountability item involves a URL/service:
- Open the URL in a browser
- Take a screenshot
- Run through the full user flow (not just health check)
- Return pass/fail with evidence

### 2. src/work-session.ts  
Structured work session orchestration logic:
- Read all items, assess state, pick what to work on
- Enforce "read doc before working" rule
- Track session state between phases
- Handle the "reassess fresh" flow when stuck

### 3. Fix TypeScript compilation
- Need to handle the openclaw/plugin-sdk import (peer dependency)
- Make sure it compiles cleanly

### 4. Tests
- Unit tests for Monday.com client (mock API responses)
- Test completion rule enforcement (Roy-assigned items can't be marked Done)
- Test messaging hour checks

## Key Design Principles (DO NOT VIOLATE)
1. **Read before acting**: Agent MUST read item doc before any work
2. **Sub-agents get full context**: Every spawned sub-agent gets complete item doc
3. **Owner controls completion**: Roy-assigned items cannot be marked Done by the agent
4. **Verify, don't assume**: URL-based items need browser testing
5. **Respect messaging hours**: No messages outside 8AM-10PM (Asia/Jerusalem)
6. **Code via Claude Code**: Never write code directly in the plugin — use Claude Code

## Reference
- OpenClaw plugin docs: look at the voice-call plugin in /Users/clawclaw/.local/share/fnm/node-versions/v22.22.0/installation/lib/node_modules/openclaw/extensions/voice-call/ for structure reference
- Plugin manifest docs: /Users/clawclaw/.local/share/fnm/node-versions/v22.22.0/installation/lib/node_modules/openclaw/docs/plugins/manifest.md
- Agent tools docs: /Users/clawclaw/.local/share/fnm/node-versions/v22.22.0/installation/lib/node_modules/openclaw/docs/plugins/agent-tools.md
