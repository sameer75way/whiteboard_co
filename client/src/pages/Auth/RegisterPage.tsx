import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button, TextButton } from '../../components/ui/Button';
import { useDispatch } from 'react-redux';
import { setAuth } from '../../store/auth/authSlice';
import { useRegisterMutation } from '../../services/api/authApi';

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

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema } from '../../store/auth/register.schema';

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerUser, { isLoading, error }] = useRegisterMutation();
  
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerUser({ name: data.name, email: data.email, password: data.password }).unwrap();
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
        <div style={{ marginBottom: '-1rem' }}>
          <TextButton 
            onClick={() => navigate('/')} 
            style={{ padding: 0, textTransform: 'none', color: '#64748b', fontSize: '0.875rem' }}
          >
            ← Back to home
          </TextButton>
        </div>

        <HeaderBox>
          <Title>Create Account</Title>
          <Subtitle>Join and start collaborating today.</Subtitle>
          {error && <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {error && typeof error === 'object' && 'data' in error && error.data && typeof error.data === 'object' && 'message' in error.data ? (error.data as {message: string}).message : 'Registration failed.'}
          </div>}
        </HeaderBox>

        <Form onSubmit={handleSubmit(onSubmit)}>
          <Input 
            label="Full Name" 
            type="text" 
            placeholder="John Doe"
            {...formRegister('name')}
            error={!!formErrors.name}
            helperText={formErrors.name?.message}
          />
          <Input 
            label="Email Address" 
            type="email" 
            placeholder="you@company.com"
            {...formRegister('email')}
            error={!!formErrors.email}
            helperText={formErrors.email?.message}
          />
          <Input 
            label="Password" 
            type="password" 
            placeholder="Minimum 6 characters"
            {...formRegister('password')}
            error={!!formErrors.password}
            helperText={formErrors.password?.message}
          />
          <Button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? 'Creating...' : 'Sign Up'}
          </Button>
        </Form>

        <FooterBox>
          Already have an account?{' '}
          <TextButton onClick={() => navigate('/login')} style={{ padding: 0 }}>
            Log in
          </TextButton>
        </FooterBox>
      </AuthCard>
    </PageContainer>
  );
};
