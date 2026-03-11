import { baseApi } from "./baseApi";

export const boardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getBoards: builder.query({
      query: () => "/boards",
      providesTags: ['Board']
    }),

    getJoinRequests: builder.query({
      query: () => "/boards/join-requests",
      providesTags: ['Board']
    }),

    createBoard: builder.mutation({
      query: (body) => ({
        url: "/boards",
        method: "POST",
        body
      }),
      invalidatesTags: ['Board']
    }),

    getBoard: builder.query({
      query: (id: string) => `/boards/${id}`,
      providesTags: ['Board']
    }),

    joinBoard: builder.mutation({
      query: (body: { shareCode: string }) => ({
        url: "/boards/join",
        method: "POST",
        body
      }),
      invalidatesTags: ['Board']
    }),

    deleteBoard: builder.mutation({
      query: (id: string) => ({
        url: `/boards/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: ['Board']
    }),

    updateRole: builder.mutation({
      query: ({ boardId, userId, role }: { boardId: string; userId: string; role: string }) => ({
        url: `/boards/${boardId}/role`,
        method: "PUT",
        body: { userId, role }
      }),
      invalidatesTags: ['Board']
    }),

    removeMember: builder.mutation({
      query: ({ boardId, userId }: { boardId: string; userId: string }) => ({
        url: `/boards/${boardId}/members/${userId}`,
        method: "DELETE"
      }),
      invalidatesTags: ['Board']
    }),

    resolveJoinRequest: builder.mutation({
      query: ({ boardId, userId, action, role }: { boardId: string; userId: string; action: 'accept' | 'reject'; role?: string }) => ({
        url: `/boards/${boardId}/join-request`,
        method: "PUT",
        body: { userId, action, role }
      }),
      invalidatesTags: ['Board']
    }),

    getAllBoards: builder.query({
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