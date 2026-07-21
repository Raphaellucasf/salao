import 'server-only';

import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';

type EventLevel = 'info' | 'warn' | 'error';
type SafeValue = string | number | boolean | null | undefined;

export interface SecurityEvent {
  event: string;
  route: string;
  status: number;
  requestId: string;
  level?: EventLevel;
  unitId?: string;
  errorClass?: string;
  errorCode?: string;
  integration?: string;
}

const SAFE_FIELDS = new Set([
  'event',
  'route',
  'status',
  'requestId',
  'unitId',
  'errorClass',
  'errorCode',
  'integration',
]);

const FORBIDDEN_FIELD = /token|authorization|cookie|password|secret|apikey|email|phone|telefone|cpf|payload/i;

export function getRequestId(request: NextRequest): string {
  const incoming = request.headers.get('x-request-id')?.trim();
  return incoming && /^[A-Za-z0-9._:-]{8,128}$/.test(incoming) ? incoming : randomUUID();
}

export function toErrorDetails(value: unknown): { errorClass: string; errorCode?: string } {
  if (value instanceof Error) return { errorClass: value.name || 'Error' };
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { name?: unknown; code?: unknown };
    return {
      errorClass: typeof candidate.name === 'string' ? candidate.name : 'ExternalError',
      ...(typeof candidate.code === 'string' ? { errorCode: candidate.code.slice(0, 64) } : {}),
    };
  }
  return { errorClass: typeof value };
}

export function sanitizeEvent(event: SecurityEvent): Record<string, SafeValue> {
  return Object.fromEntries(
    Object.entries(event)
      .filter(([key, value]) => SAFE_FIELDS.has(key) && !FORBIDDEN_FIELD.test(key) && value !== undefined)
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 160) : value]),
  );
}

export function logSecurityEvent(event: SecurityEvent): void {
  const { level = event.status >= 500 ? 'error' : event.status >= 400 ? 'warn' : 'info' } = event;
  const line = JSON.stringify(sanitizeEvent(event));
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}
