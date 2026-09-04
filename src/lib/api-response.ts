/**
 * Envelope response API yang konsisten — referensi PRD Section 25 & 29.
 * Success: { success: true, data, meta? }
 * Error  : { success: false, error: { code, message, details? } }
 */
import { NextResponse } from "next/server";
import { ApiError, apiError } from "./errors";

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPage: number;
}

export function ok<T>(data: T, meta?: PaginationMeta): NextResponse {
  return NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(error: ApiError | unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(error.toBody(), { status: error.status });
  }
  const internal = apiError("INTERNAL_DB_ERROR", "Terjadi kesalahan internal, silakan coba lagi.");
  console.error("Unhandled error:", error);
  return NextResponse.json(internal.toBody(), { status: internal.status });
}

/** Bungkus handler agar pengecualian ter-format konsisten. */
export function handle<T>(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch(fail);
}