/**
 * Ambient module declarations so TypeScript compiles without peer/optional
 * packages installed. When the real packages are present in node_modules,
 * TypeScript uses those types instead of these stubs.
 */

declare module "openclaw/plugin-sdk" {
  export interface OpenClawPluginApi {
    pluginConfig?: Record<string, unknown>;
    registerTool(tool: {
      name: string;
      description: string;
      parameters: unknown;
      execute: (
        id: string,
        params: any
      ) => Promise<{ content: Array<{ type: string; text: string }> }>;
    }): void;
  }
}

declare module "@sinclair/typebox" {
  export type TSchema = { _type?: unknown; [key: string]: unknown };

  export const Type: {
    Object(
      properties: Record<string, TSchema>,
      options?: Record<string, unknown>
    ): TSchema;
    String(options?: Record<string, unknown>): TSchema;
    Number(options?: Record<string, unknown>): TSchema;
    Boolean(options?: Record<string, unknown>): TSchema;
    Array(items: TSchema, options?: Record<string, unknown>): TSchema;
    Union(types: TSchema[], options?: Record<string, unknown>): TSchema;
    Literal<T extends string | number | boolean>(
      value: T,
      options?: Record<string, unknown>
    ): TSchema;
    Optional(schema: TSchema): TSchema;
    Null(options?: Record<string, unknown>): TSchema;
  };

  export type Static<T extends TSchema> = unknown;
}
