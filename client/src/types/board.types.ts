export interface BoardMember {
  _id: string; 
  user: {
    _id: string;
    name: string;
    email: string;
  };
  status: "Pending" | "Accepted";
  role: "Owner" | "Collaborator" | "Viewer";
  joinedAt?: string;
}

export interface Board {
  _id: string;
  name: string;
  owner: string | { _id: string; name: string };
  members: BoardMember[];
  shareCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JoinRequest {
  boardId: string;
  boardName: string;
  userId: string;
  userName: string;
  userEmail: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
