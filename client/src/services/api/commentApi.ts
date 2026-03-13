import { baseApi } from "./baseApi";
import type { CommentThread, CommentPopulated } from "../../types/comment.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listComments: builder.query<CommentThread, string>({
      query: (elementId) => `/elements/${elementId}/comments`,
      transformResponse: (response: ApiResponse<CommentThread>) => response.data,
      providesTags: ["Comment"]
    }),

    createComment: builder.mutation<
      CommentPopulated,
      { elementId: string; content: string }
    >({
      query: ({ elementId, content }) => ({
        url: `/elements/${elementId}/comments`,
        method: "POST",
        body: { content }
      }),
      transformResponse: (response: ApiResponse<CommentPopulated>) => response.data,
      invalidatesTags: ["Comment"]
    }),

    createReply: builder.mutation<
      CommentPopulated,
      { elementId: string; commentId: string; content: string }
    >({
      query: ({ elementId, commentId, content }) => ({
        url: `/elements/${elementId}/comments/${commentId}/replies`,
        method: "POST",
        body: { content }
      }),
      transformResponse: (response: ApiResponse<CommentPopulated>) => response.data,
      invalidatesTags: ["Comment"]
    }),

    deleteComment: builder.mutation<
      void,
      { elementId: string; commentId: string }
    >({
      query: ({ elementId, commentId }) => ({
        url: `/elements/${elementId}/comments/${commentId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Comment"]
    })
  })
});

export const {
  useListCommentsQuery,
  useCreateCommentMutation,
  useCreateReplyMutation,
  useDeleteCommentMutation
} = commentApi;
