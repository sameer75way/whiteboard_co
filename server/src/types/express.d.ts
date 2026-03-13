declare global {
  interface AuthUser {
    id: string;
    role: string;
  }

  namespace Express {
    interface Request {
      user?: AuthUser;
      boardMemberRole?: string;
    }
  }
}

export {};
