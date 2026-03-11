import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useResetPasswordMutation } from '../../services/api/authApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { setAuth } from '../../store/auth/authSlice';
import { keyframes } from '@mui/system';

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const PageContainer = styled('div')(() => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(-45deg, #0f172a, #1e1b4b, #312e81, #0f172a)`,
  backgroundSize: '400% 400%',
  animation: `${gradientAnimation} 15s ease infinite`,
  padding: '2rem',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at center, transparent 0%, #0f172a 100%)',
    opacity: 0.8,
    pointerEvents: 'none',
  }
}));

const AuthCard = styled(Card)({
  maxWidth: 440,
  width: '100%',
  gap: '2rem',
  padding: '3rem 2.5rem',
  position: 'relative',
  zIndex: 1
});

const HeaderBox = styled('div')({
  textAlign: 'center',
});

const Title = styled('h1')(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 800,
  color: theme.palette.text.primary,
  marginBottom: '0.5rem',
  letterSpacing: '-0.5px',
}));

const Subtitle = styled('p')(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.95rem',
}));

const Form = styled('form')({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token } = useParams<{ token: string }>();
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      if (!token) return;
      const response = await resetPassword({ token, password: data.password }).unwrap();
      dispatch(setAuth({
        user: response.data.user,
        accessToken: response.data.accessToken
      }));
      navigate('/dashboard');
    } catch {
      return;
    }
  };

  return (
    <PageContainer>
      <AuthCard>
        <HeaderBox>
          <Title>Create New Password</Title>
          <Subtitle>Your new password must be different from previous used passwords.</Subtitle>
          {error && <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {(() => {
              if (typeof error !== 'object' || !error) return 'Something went wrong.';
              if ('data' in error) {
                const data = error.data as Record<string, string | Array<{message: string}>>;
                if (data?.message && typeof data.message === 'string') return data.message;
                if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                  return data.errors[0].message;
                }
              }
              return 'Invalid or expired token.';
            })()}
          </div>}
        </HeaderBox>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Input 
            label="New Password" 
            type="password" 
            placeholder="••••••••"
            {...formRegister('password')}
            error={!!formErrors.password}
            helperText={formErrors.password?.message}
          />
          <Input 
            label="Confirm Password" 
            type="password" 
            placeholder="••••••••"
            {...formRegister('confirmPassword')}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword?.message}
          />
          <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Form>
      </AuthCard>
    </PageContainer>
  );
};
