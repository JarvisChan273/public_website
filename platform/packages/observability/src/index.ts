export type LogField = string | number | boolean;

export interface LogEvent {
  event: string;
  correlationId: string;
  fields?: Record<string, LogField>;
}

const forbiddenFields = new Set(["email", "message", "subject", "name", "body"]);

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function logEvent(
  entry: LogEvent,
  write: (line: string) => void = console.log,
): void {
  const fields = entry.fields ?? {};
  for (const key of Object.keys(fields)) {
    if (forbiddenFields.has(key.toLowerCase())) {
      throw new Error(`refusing to log field ${key}`);
    }
  }
  write(
    JSON.stringify({
      event: entry.event,
      correlationId: entry.correlationId,
      fields,
    }),
  );
}
