import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'AUTH_REQUIRED'
  | 'ACCESS_DENIED'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTEGRATION_UNAVAILABLE'
  | 'SUPABASE_SYNC_REQUIRED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

interface ApiErrorBody {
  error: string;
  code: ApiErrorCode;
  requestId?: string;
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  requestId?: string,
) {
  const body: ApiErrorBody = {
    error: message,
    code,
    ...(requestId ? { requestId } : {}),
  };
  return NextResponse.json(body, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
