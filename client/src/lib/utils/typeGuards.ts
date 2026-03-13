type StructuredError = 
  | Error 
  | { data?: { message?: string }; message?: string } 
  | { status?: number; data?: { message?: string } }
  | string;

export const getErrorMessage = (error: StructuredError | null | undefined): string => {
  if (!error) return "An unexpected error occurred";
  
  if (error instanceof Error) return error.message;
  
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    if ("data" in error && error.data && typeof error.data === "object" && "message" in error.data) {
      return (error.data as { message: string }).message;
    }
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
  }
  
  return "An unexpected error occurred";
};
