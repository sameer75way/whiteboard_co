export interface ApiError {
  data?: { message?: string };
  status?: number;
}

export const getApiErrorMessage = (err: ApiError, fallback: string): string => {
  return err?.data?.message || fallback;
};
