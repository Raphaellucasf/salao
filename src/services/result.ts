import type { ApiErrorCode } from '@/lib/api-response';

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ApiErrorCode; message: string; status: number };

export function serviceSuccess<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function serviceFailure(
  code: ApiErrorCode,
  message: string,
  status: number,
): ServiceResult<never> {
  return { ok: false, code, message, status };
}
