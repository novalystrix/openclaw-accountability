/**
 * Monday.com GraphQL API client for accountability board operations.
 */

export interface MondayConfig {
  apiToken: string;
  boardId: number;
  columns: {
    status: string;
    checkFrequency: string;
    lastChecked: string;
    details: string;
    assignedBy: string;
  };
}

export interface AccountabilityItem {
  id: string;
  name: string;
  status: string | null;
  checkFrequency: string | null;
  lastChecked: string | null;
  details: string | null;
  assignedBy: string | null;
  updates: Array<{ body: string; createdAt: string }>;
  subitems: Array<{
    id: string;
    name: string;
    status: string | null;
    details: string | null;
  }>;
}

const MONDAY_API = "https://api.monday.com/v2";

async function mondayQuery(token: string, query: string, variables?: Record<string, unknown>): Promise<any> {
  const body: any = { query };
  if (variables) body.variables = variables;

  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: {
      "Authorization": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Monday.com API error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

export async function listActiveItems(config: MondayConfig): Promise<AccountabilityItem[]> {
  const data = await mondayQuery(config.apiToken, `{
    boards(ids: ${config.boardId}) {
      items_page(limit: 50) {
        items {
          id
          name
          column_values { id text value }
          updates(limit: 5) { body created_at }
          subitems {
            id
            name
            column_values { id text value }
          }
        }
      }
    }
  }`);

  const items = data.boards?.[0]?.items_page?.items ?? [];
  return items.map((item: any) => {
    const col = (id: string) => item.column_values?.find((c: any) => c.id === id)?.text ?? null;
    return {
      id: item.id,
      name: item.name,
      status: col(config.columns.status),
      checkFrequency: col(config.columns.checkFrequency),
      lastChecked: col(config.columns.lastChecked),
      details: col(config.columns.details),
      assignedBy: col(config.columns.assignedBy),
      updates: (item.updates ?? []).map((u: any) => ({ body: u.body, createdAt: u.created_at })),
      subitems: (item.subitems ?? []).map((si: any) => {
        const scol = (id: string) => si.column_values?.find((c: any) => c.id === id)?.text ?? null;
        return {
          id: si.id,
          name: si.name,
          status: scol(config.columns.status),
          details: scol(config.columns.details),
        };
      }),
    };
  });
}

export async function createItem(config: MondayConfig, name: string, details: string, assignedBy: string): Promise<string> {
  const colValues = JSON.stringify({
    [config.columns.details]: { text: details },
    [config.columns.assignedBy]: { label: assignedBy },
  });

  const data = await mondayQuery(config.apiToken,
    `mutation ($board: ID!, $name: String!, $cols: JSON!) {
      create_item(board_id: $board, item_name: $name, column_values: $cols) { id }
    }`,
    { board: config.boardId, name, cols: colValues }
  );
  return data.create_item.id;
}

export async function createSubitem(config: MondayConfig, parentId: string, name: string, details?: string): Promise<string> {
  const colValues = details
    ? JSON.stringify({ [config.columns.details]: { text: details } })
    : "{}";

  const data = await mondayQuery(config.apiToken,
    `mutation ($parent: ID!, $name: String!, $cols: JSON!) {
      create_subitem(parent_item_id: $parent, item_name: $name, column_values: $cols) { id }
    }`,
    { parent: parentId, name, cols: colValues }
  );
  return data.create_subitem.id;
}

export async function writeUpdate(config: MondayConfig, itemId: string, htmlBody: string): Promise<string> {
  const data = await mondayQuery(config.apiToken,
    `mutation ($item: ID!, $body: String!) {
      create_update(item_id: $item, body: $body) { id }
    }`,
    { item: itemId, body: htmlBody }
  );
  return data.create_update.id;
}

export async function setLastChecked(config: MondayConfig, itemId: string, date: string): Promise<void> {
  await mondayQuery(config.apiToken,
    `mutation ($board: ID!, $item: ID!, $col: String!, $val: JSON!) {
      change_column_value(board_id: $board, item_id: $item, column_id: $col, value: $val) { id }
    }`,
    { board: config.boardId, item: itemId, col: config.columns.lastChecked, val: JSON.stringify({ date }) }
  );
}

export async function setStatus(config: MondayConfig, itemId: string, label: "Working on it" | "Done" | "Stuck"): Promise<void> {
  await mondayQuery(config.apiToken,
    `mutation ($board: ID!, $item: ID!, $col: String!, $val: JSON!) {
      change_column_value(board_id: $board, item_id: $item, column_id: $col, value: $val) { id }
    }`,
    { board: config.boardId, item: itemId, col: config.columns.status, val: JSON.stringify({ label }) }
  );
}
