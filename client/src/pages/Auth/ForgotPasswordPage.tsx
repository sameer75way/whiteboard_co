import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button, TextButton } from '../../components/ui/Button';
import { useForgotPasswordMutation } from '../../services/api/authApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPasswordSchema } from '../../store/auth/forgotPassword.schema';
import { useState } from 'react';

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

const SuccessMessage = styled('div')(({ theme }) => ({
  backgroundColor: `${theme.palette.success.main}1A`,
  color: theme.palette.success.main,
  padding: '1rem',
  borderRadius: 8,
  textAlign: 'center',
  fontSize: '0.95rem',
  fontWeight: 500,
}));

const FooterBox = styled('div')(({ theme }) => ({
  textAlign: 'center',
  fontSize: '0.95rem',
  color: theme.palette.text.secondary,
  marginTop: '1rem',
}));


type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPassword({ email: data.email }).unwrap();
      setSubmitted(true);
    } catch {
      return;
    }
  };

  return (
    <PageContainer>
      <AuthCard>
        <HeaderBox>
          <Title>Reset Password</Title>
          <Subtitle>Enter your email and we'll send you a reset link.</Subtitle>
          {error && <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data ? (error.data as {message: string}).message : 'Something went wrong.'}
          </div>}
        </HeaderBox>

        {submitted ? (
          <SuccessMessage>
            If that email matches an account, we've sent a password reset link.
          </SuccessMessage>
        ) : (
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="you@company.com"
              {...formRegister('email')}
              error={!!formErrors.email}
              helperText={formErrors.email?.message}
            />
            <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Form>
        )}

        <FooterBox>
          Remember your password?{' '}
          <TextButton onClick={() => navigate('/login')} style={{ padding: 0 }}>
            Log in
          </TextButton>
        </FooterBox>
      </AuthCard>
    </PageContainer>
  );
};
