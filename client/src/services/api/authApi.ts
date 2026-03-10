import { baseApi } from './baseApi';
import type { AdminUser } from '../../pages/Admin/components/UserBoardCard';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (credentials) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: credentials,
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: 'POST',
        body: { password },
      }),
    }),
    getAllUsers: builder.query<{ success: boolean; message: string; data: AdminUser[] }, void>({
      query: () => '/auth/admin/users',
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetAllUsersQuery,
} = authApi;
