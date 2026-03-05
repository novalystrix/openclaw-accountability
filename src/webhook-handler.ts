/**
 * Pure handler for Monday.com webhook events. No I/O side effects.
 */

export interface MondayEvent {
  type: string;
  pulseId?: number;
  itemId?: number;
  body?: string;
  updateBody?: string;
  userName?: string;
  [key: string]: unknown;
}

export interface WebhookPayload {
  challenge?: string;
  event?: MondayEvent;
}

export interface HandleResult {
  shouldRespond: boolean;
  itemId: string | null;
  updateBody: string | null;
  authorName: string | null;
}

export function handleMondayWebhook(event: MondayEvent, agentName = "Novalystrix"): HandleResult {
  const noMatch: HandleResult = { shouldRespond: false, itemId: null, updateBody: null, authorName: null };

  if (event.type !== "create_update") return noMatch;

  const body = event.updateBody ?? event.body ?? "";
  const itemId = event.pulseId ?? event.itemId;

  // Respond to all updates on the board (webhook is scoped to our board)
  return {
    shouldRespond: true,
    itemId: itemId != null ? String(itemId) : null,
    updateBody: body,
    authorName: event.userName ?? null,
  };
}
