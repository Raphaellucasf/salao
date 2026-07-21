export type JsonObject = Record<string, unknown>;

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

export async function parseJsonObject(
  request: Request,
  options: { maxBytes?: number } = {},
): Promise<JsonObject> {
  const maxBytes = options.maxBytes ?? 32_768;
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > maxBytes) throw new InputValidationError('Payload excede o limite permitido');

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new InputValidationError('Payload excede o limite permitido');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InputValidationError('JSON inválido');
  }
  if (!isJsonObject(parsed)) throw new InputValidationError('Payload deve ser um objeto JSON');
  return parsed;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function asPositiveInteger(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number.NaN;
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function asMoney(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(number) && number > 0 && number <= 10_000_000 ? Math.round(number * 100) / 100 : null;
}

export function asBoundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 && text.length <= maxLength ? text : null;
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
