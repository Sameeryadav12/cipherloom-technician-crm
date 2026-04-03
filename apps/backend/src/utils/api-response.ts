import type { Response } from "express";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  details: unknown | null;
};

export function ok<T>(
  res: Response,
  data: T,
  options?: { message?: string }
) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    message: options?.message
  };
  return res.status(200).json(body);
}

export function created<T>(
  res: Response,
  data: T,
  options?: { message?: string }
) {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    message: options?.message
  };
  return res.status(201).json(body);
}

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export function paginated<T>(
  res: Response,
  data: Paginated<T>,
  options?: { message?: string }
) {
  const body: ApiSuccessResponse<Paginated<T>> = {
    success: true,
    data,
    message: options?.message
  };
  return res.status(200).json(body);
}

