/**
 * Standar error codes & error envelope — referensi PRD Section 29.
 * Semua endpoint mengembalikan envelope:
 *   { success: false, error: { code, message, details? } }
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BARCODE_CONFLICT"
  | "CATEGORY_HAS_PRODUCTS"
  | "CATEGORY_NAME_DUPLICATE"
  | "CATEGORY_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "DUPLICATE_INVOICE"
  | "STOCK_INSUFFICIENT"
  | "NEGATIVE_STOCK_NOT_ALLOWED"
  | "PAYMENT_METHOD_INACTIVE"
  | "PAYMENT_INSUFFICIENT"
  | "EMPTY_CART"
  | "BARCODE_NOT_REGISTERED"
  | "INTERNAL_DB_ERROR";

export interface ApiErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  details?: Record<string, unknown>;

  constructor(status: number, code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toBody(): ApiErrorBody {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

/** Helper shortcut untuk membuat ApiError dengan status berdasarkan kode. */
export function apiError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  const statusMap: Record<ErrorCode, number> = {
    VALIDATION_ERROR: 400,
    UNAUTHENTICATED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    BARCODE_CONFLICT: 409,
    CATEGORY_HAS_PRODUCTS: 409,
    CATEGORY_NAME_DUPLICATE: 409,
    CATEGORY_NOT_FOUND: 400,
    PRODUCT_NOT_FOUND: 404,
    DUPLICATE_INVOICE: 409,
    STOCK_INSUFFICIENT: 409,
    NEGATIVE_STOCK_NOT_ALLOWED: 409,
    PAYMENT_METHOD_INACTIVE: 400,
    PAYMENT_INSUFFICIENT: 400,
    EMPTY_CART: 400,
    BARCODE_NOT_REGISTERED: 404,
    INTERNAL_DB_ERROR: 500,
  };
  return new ApiError(statusMap[code], code, message, details);
}