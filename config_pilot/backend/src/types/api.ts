export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(code: string, message: string): ApiError {
  return { ok: false, error: { code, message } };
}

export class SafeError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  public constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "SafeError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
