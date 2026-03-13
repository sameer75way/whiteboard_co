import { baseApi } from "./baseApi";

export const elementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getBoardElements: builder.query({
      query: (boardId: string) => `/elements/boards/${boardId}/elements`,
      providesTags: ['Elements']
    }),

  })
});

export const {
  useGetBoardElementsQuery
} = elementApi;