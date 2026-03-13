import { baseApi } from "./baseApi";
import type { ApiResponse } from "../../types/board.types";
import type { SnapshotListItem, SnapshotDetail } from "../../store/snapshot/snapshotSlice";

interface PaginatedSnapshotsResponse {
  snapshots: SnapshotListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export const snapshotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    listSnapshots: builder.query<
      PaginatedSnapshotsResponse,
      { boardId: string; page: number; limit: number }
    >({
      query: ({ boardId, page, limit }) => ({
        url: `/boards/${boardId}/snapshots?page=${page}&limit=${limit}`,
        method: "GET"
      }),
      transformResponse: (response: ApiResponse<PaginatedSnapshotsResponse>) =>
        response.data,
      providesTags: ["Snapshot"]
    }),

    getSnapshot: builder.query<
      SnapshotDetail,
      { boardId: string; snapshotId: string }
    >({
      query: ({ boardId, snapshotId }) => ({
        url: `/boards/${boardId}/snapshots/${snapshotId}`,
        method: "GET"
      }),
      transformResponse: (response: ApiResponse<SnapshotDetail>) =>
        response.data,
      providesTags: ["Snapshot"]
    }),

    createManualSnapshot: builder.mutation<
      SnapshotListItem,
      { boardId: string; name: string }
    >({
      query: ({ boardId, name }) => ({
        url: `/boards/${boardId}/snapshots`,
        method: "POST",
        body: { name }
      }),
      transformResponse: (response: ApiResponse<SnapshotListItem>) =>
        response.data,
      invalidatesTags: ["Snapshot"]
    }),

    restoreSnapshot: builder.mutation<
      { newSnapshotId: string },
      { boardId: string; snapshotId: string }
    >({
      query: ({ boardId, snapshotId }) => ({
        url: `/boards/${boardId}/snapshots/${snapshotId}/restore`,
        method: "POST"
      }),
      transformResponse: (response: ApiResponse<{ newSnapshotId: string }>) =>
        response.data,
      invalidatesTags: ["Snapshot"]
    }),

    deleteSnapshot: builder.mutation<
      void,
      { boardId: string; snapshotId: string }
    >({
      query: ({ boardId, snapshotId }) => ({
        url: `/boards/${boardId}/snapshots/${snapshotId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Snapshot"]
    })

  })
});

export const {
  useListSnapshotsQuery,
  useGetSnapshotQuery,
  useCreateManualSnapshotMutation,
  useRestoreSnapshotMutation,
  useDeleteSnapshotMutation
} = snapshotApi;
