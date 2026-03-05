/**
 * Standalone HTTP server for receiving Monday.com webhook events.
 *
 * Usage: node --import tsx/esm src/webhook.ts
 *
 * Env vars:
 *   WEBHOOK_PORT  - port to listen on (default: 18802)
 *   AGENT_NAME    - agent name to watch for @mentions (default: Novalystrix)
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { handleMondayWebhook, WebhookPayload } from "./webhook-handler.js";

const PORT = parseInt(process.env.WEBHOOK_PORT ?? "18802", 10);
const AGENT_NAME = process.env.AGENT_NAME ?? "Novalystrix";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST") {
    send(res, 405, { error: "Method Not Allowed" });
    return;
  }

  let payload: WebhookPayload;
  try {
    const raw = await readBody(req);
    payload = JSON.parse(raw) as WebhookPayload;
  } catch {
    send(res, 400, { error: "Invalid JSON" });
    return;
  }

  // Monday.com URL verification challenge
  if (payload.challenge !== undefined) {
    send(res, 200, { challenge: payload.challenge });
    return;
  }

  const event = payload.event;
  if (!event) {
    send(res, 200, { ok: true });
    return;
  }

  if (event.type === "create_update") {
    const result = handleMondayWebhook(event, AGENT_NAME);
    if (result.shouldRespond) {
      process.stdout.write(JSON.stringify(result) + "\n");
    }
  }

  send(res, 200, { ok: true });
});

server.listen(PORT, () => {
  process.stderr.write(`Monday.com webhook receiver listening on port ${PORT} (agent: @${AGENT_NAME})\n`);
});
