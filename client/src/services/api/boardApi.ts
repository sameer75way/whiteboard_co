import { baseApi } from "./baseApi";
import type { Board, ApiResponse, JoinRequest } from "../../types/board.types";

export const boardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getBoards: builder.query<ApiResponse<Board[]>, null>({
      query: () => "/boards",
      providesTags: ['Board']
    }),

    getJoinRequests: builder.query<ApiResponse<JoinRequest[]>, null>({
      query: () => "/boards/join-requests",
      providesTags: ['Board']
    }),

    createBoard: builder.mutation<ApiResponse<Board>, { name: string }>({
      query: (body) => ({
        url: "/boards",
        method: "POST",
        body
      }),
      invalidatesTags: ['Board']
    }),

    getBoard: builder.query<ApiResponse<Board>, string>({
      query: (id: string) => `/boards/${id}`,
      providesTags: ['Board']
    }),

    joinBoard: builder.mutation<ApiResponse<Board>, { shareCode: string }>({
      query: (body: { shareCode: string }) => ({
        url: "/boards/join",
        method: "POST",
        body
      }),
      invalidatesTags: ['Board']
    }),

    deleteBoard: builder.mutation<ApiResponse<void>, string>({
      query: (id: string) => ({
        url: `/boards/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ['Board']
    }),

    updateRole: builder.mutation<ApiResponse<Board>, { boardId: string; userId: string; role: string }>({
      query: ({ boardId, userId, role }) => ({
        url: `/boards/${boardId}/role`,
        method: "PUT",
        body: { userId, role }
      }),
      invalidatesTags: ['Board']
    }),

    removeMember: builder.mutation<ApiResponse<Board>, { boardId: string; userId: string }>({
      query: ({ boardId, userId }) => ({
        url: `/boards/${boardId}/members/${userId}`,
        method: "DELETE"
      }),
      invalidatesTags: ['Board']
    }),

    resolveJoinRequest: builder.mutation<ApiResponse<Board>, { boardId: string; userId: string; action: 'accept' | 'reject'; role?: string }>({
      query: ({ boardId, userId, action, role }) => ({
        url: `/boards/${boardId}/join-request`,
        method: "PUT",
        body: { userId, action, role }
      }),
      invalidatesTags: ['Board']
    }),

    getAllBoards: builder.query<ApiResponse<Board[]>, undefined>({
      query: () => "/boards/admin/all",
      providesTags: ['Board']
    }),
  })
});

export const {
  useGetBoardsQuery,
  useCreateBoardMutation,
  useGetBoardQuery,
  useJoinBoardMutation,
  useDeleteBoardMutation,
  useUpdateRoleMutation,
  useRemoveMemberMutation,
  useResolveJoinRequestMutation,
  useGetJoinRequestsQuery,
  useGetAllBoardsQuery,
} = boardApi;