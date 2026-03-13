import { baseApi } from "./baseApi";
import type { ApiResponse, Layer } from "../../types/board.types";

export const layerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    createLayer: builder.mutation<ApiResponse<Layer>, { boardId: string; name: string }>({
      query: ({ boardId, name }) => ({
        url: `/boards/${boardId}/layers`,
        method: "POST",
        body: { name }
      })
    }),

    updateLayer: builder.mutation<ApiResponse<Layer>, { boardId: string; layerId: string; name?: string; isVisible?: boolean; isLocked?: boolean }>({
      query: ({ boardId, layerId, ...body }) => ({
        url: `/boards/${boardId}/layers/${layerId}`,
        method: "PATCH",
        body
      })
    }),

    deleteLayer: builder.mutation<ApiResponse<{ deletedLayerId: string }>, { boardId: string; layerId: string }>({
      query: ({ boardId, layerId }) => ({
        url: `/boards/${boardId}/layers/${layerId}`,
        method: "DELETE"
      })
    }),

    reorderLayers: builder.mutation<ApiResponse<Layer[]>, { boardId: string; orderedLayerIds: string[] }>({
      query: ({ boardId, orderedLayerIds }) => ({
        url: `/boards/${boardId}/layers/reorder`,
        method: "PATCH",
        body: { orderedLayerIds }
      })
    }),

    moveElementToLayer: builder.mutation<ApiResponse<{ elementId: string; newLayerId: string }>, { boardId: string; elementId: string; newLayerId: string }>({
      query: ({ boardId, elementId, newLayerId }) => ({
        url: `/boards/${boardId}/layers/elements/${elementId}/layer`,
        method: "PATCH",
        body: { newLayerId }
      })
    })

  })
});

export const {
  useCreateLayerMutation,
  useUpdateLayerMutation,
  useDeleteLayerMutation,
  useReorderLayersMutation,
  useMoveElementToLayerMutation
} = layerApi;
