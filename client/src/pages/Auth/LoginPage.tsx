import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button, TextButton } from '../../components/ui/Button';
import { useDispatch } from 'react-redux';
import { setAuth } from '../../store/auth/authSlice';
import { useLoginMutation } from '../../services/api/authApi';

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

const FooterBox = styled('div')(({ theme }) => ({
  textAlign: 'center',
  fontSize: '0.95rem',
  color: theme.palette.text.secondary,
  marginTop: '1rem',
}));

const TopNavBox = styled('div')({
  marginBottom: '-1rem'
});

const BackButton = styled(TextButton)(({ theme }) => ({
  padding: 0,
  textTransform: 'none',
  color: theme.palette.text.secondary,
  fontSize: '0.875rem'
}));

const ErrorText = styled('div')(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: '0.5rem',
  fontSize: '0.9rem'
}));

const ForgotPasswordBox = styled('div')({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '-0.5rem'
});

const ForgotPasswordLink = styled(TextButton)({
  padding: 0,
  fontSize: '0.875rem'
});

const SubmitButton = styled(Button)({
  marginTop: '0.5rem'
});

const LinkButton = styled(TextButton)({
  padding: 0
});

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loginSchema } from '../../store/auth/login.schema';

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login({ email: data.email, password: data.password }).unwrap();
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
        <TopNavBox>
          <BackButton onClick={() => navigate('/')}>
            ← Back to home
          </BackButton>
        </TopNavBox>

        <HeaderBox>
          <Title>Welcome Back</Title>
          <Subtitle>Log in to access your whiteboards.</Subtitle>
          {error && <ErrorText>
            {error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data ? (error.data as {message: string}).message : 'Invalid email or password.'}
          </ErrorText>}
        </HeaderBox>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Input 
            label="Email Address"
            type="email" 
            placeholder="you@company.com"
            {...register('email')}
            error={!!formErrors.email}
            helperText={formErrors.email?.message}
          />
          <Input 
            label="Password"
            type="password" 
            placeholder="••••••••"
            {...register('password')}
            error={!!formErrors.password}
            helperText={formErrors.password?.message}
          />
          
          <ForgotPasswordBox>
            <ForgotPasswordLink type="button" onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </ForgotPasswordLink>
          </ForgotPasswordBox>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </SubmitButton>
        </Form>

        <FooterBox>
          Don't have an account?{' '}
          <LinkButton onClick={() => navigate('/register')}>
            Sign up
          </LinkButton>
        </FooterBox>
      </AuthCard>
    </PageContainer>
  );
};
