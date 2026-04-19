export type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError };

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
