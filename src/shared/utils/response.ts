import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api-response.type';

export const successResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(body);
};

export const createdResponse = <T>(res: Response, data: T, message?: string): void => {
  successResponse(res, data, message, 201);
};

export const noContentResponse = (res: Response): void => {
  res.status(204).send();
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Record<string, string | string[]>
): void => {
  const body: ApiResponse<null> = {
    success: false,
    message,
    ...(errors && { errors }),
  };
  res.status(statusCode).json(body);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): void => {
  const body: PaginatedResponse<T> = {
    success: true,
    data,
    pagination,
  };
  res.status(200).json(body);
};
