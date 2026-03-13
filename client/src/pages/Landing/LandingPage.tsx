import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Button, TextButton } from '../../components/ui/Button';

const PageContainer = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  backgroundImage: `
    radial-gradient(circle at 15% 50%, ${theme.palette.primary.light}80, transparent 25%),
    radial-gradient(circle at 85% 30%, ${theme.palette.secondary.light}80, transparent 25%)
  `,
  overflow: 'hidden',
}));

const Nav = styled('nav')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 2rem',
  maxWidth: 1280,
  width: '100%',
  margin: '0 auto',
});

const Logo = styled('div')(({ theme }) => ({
  fontSize: '1.5rem',
  fontWeight: 800,
  color: theme.palette.text.primary,
  letterSpacing: '-0.5px',
  span: {
    color: theme.palette.primary.main,
  },
}));

const NavActions = styled('div')({
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
});

const HeroSection = styled('main')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexGrow: 1,
  textAlign: 'center',
  padding: '4rem 2rem',
  maxWidth: 800,
  margin: '0 auto',
  zIndex: 1,
});

const Title = styled('h1')(({ theme }) => ({
  fontSize: 'clamp(3rem, 8vw, 5rem)',
  fontWeight: 900,
  lineHeight: 1.1,
  marginBottom: '1.5rem',
  color: theme.palette.text.primary,
  letterSpacing: '-1px',
  span: {
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
}));

const Subtitle = styled('p')(({ theme }) => ({
  fontSize: '1.25rem',
  color: theme.palette.text.secondary,
  marginBottom: '3rem',
  lineHeight: 1.6,
  maxWidth: 600,
}));

const ActionButtons = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: '1rem',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 300,
  },
}));

const HeroButton = styled(Button)({
  padding: '1rem 2rem',
  fontSize: '1.125rem',
  borderRadius: '50px'
});

const FeaturesGrid = styled('div')({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
  width: '100%',
  maxWidth: 1200,
  margin: '4rem auto',
  padding: '0 2rem',
});

const FeatureCard = styled('div')(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 16,
  padding: '2rem',
  boxShadow: theme.shadows[1],
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
  },
}));

const FeatureIcon = styled('div')(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  marginBottom: '1.5rem',
}));

const FeatureTitle = styled('h3')(({ theme }) => ({
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: '0.75rem',
  color: theme.palette.text.primary,
}));

const FeatureDesc = styled('p')(({ theme }) => ({
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
}));

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Nav>
        <Logo>White<span>Board</span></Logo>
        <NavActions>
          <TextButton onClick={() => navigate('/login')}>Log In</TextButton>
          <Button onClick={() => navigate('/register')}>Start Free</Button>
        </NavActions>
      </Nav>

      <HeroSection>
        <Title>
          Create together, <span>in real-time.</span>
        </Title>
        <Subtitle>
          A beautiful, infinite canvas for your team's best ideas. Draw, diagram, and brainstorm seamlessly, even when offline.
        </Subtitle>
        
        <ActionButtons>
          <HeroButton onClick={() => navigate('/register')}>
            Start Collaborating Now
          </HeroButton>
        </ActionButtons>
      </HeroSection>

      <FeaturesGrid>
        <FeatureCard>
          <FeatureIcon>⚡</FeatureIcon>
          <FeatureTitle>Real-time Sync</FeatureTitle>
          <FeatureDesc>Watch your team's ideas come to life instantly. Every stroke and movement is synced in milliseconds.</FeatureDesc>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>✈️</FeatureIcon>
          <FeatureTitle>Work Offline</FeatureTitle>
          <FeatureDesc>Lost connection? Keep drawing. We'll automatically sync your changes the moment you're back online.</FeatureDesc>
        </FeatureCard>
        
        <FeatureCard>
          <FeatureIcon>♾️</FeatureIcon>
          <FeatureTitle>Infinite Canvas</FeatureTitle>
          <FeatureDesc>Never run out of space. Zoom, pan, and expand your ideas across an endless collaborative workspace.</FeatureDesc>
        </FeatureCard>
      </FeaturesGrid>
    </PageContainer>
  );
};
