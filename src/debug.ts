const debugEscopes = [
  "boot",
  "commands",
  "callbackQueries",
  "tasks",
  "api",
  "sending",
  "error",
] as const;

type DebugScope = typeof debugEscopes[number];

const activeDebugScopes =
  (Boolean(process.env.DEBUG) && process.env.DEBUG_SCOPES?.split(",")) || [];

export function debugLog(scope: DebugScope, ...args: any[]) {
  if (activeDebugScopes.includes(scope)) console.log(...args);
}
