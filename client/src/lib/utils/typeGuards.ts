
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  
  if (typeof error === "string") return error;
  
  return "An unexpected error occurred";
};
