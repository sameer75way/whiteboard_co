import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { Box, Typography } from '@mui/material';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { styled } from '@mui/material/styles';

const CenteredContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.default
}));

const ErrorCard = styled(Card)({
  maxWidth: 500,
  width: '100%',
  padding: '32px',
  textAlign: 'center'
});

const ErrorTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.error.main,
  marginBottom: '16px'
}));

const ErrorDetailsBox = styled(Box)({
  marginTop: '24px',
  marginBottom: '32px',
  padding: '16px',
  backgroundColor: '#fef2f2',
  borderRadius: '4px',
  textAlign: 'left',
  overflow: 'auto'
});

const ErrorText = styled(Typography)({
  color: '#991b1b',
  margin: 0
});

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <CenteredContainer>
      <ErrorCard>
        <ErrorTitle variant="h5">
          Oops! Something went wrong.
        </ErrorTitle>
        <Typography variant="body2" color="text.secondary" paragraph>
          The application encountered an unexpected error.
        </Typography>
        
        <ErrorDetailsBox>
          <ErrorText variant="caption">
            {(error as Error)?.message || 'An unknown error occurred'}
          </ErrorText>
        </ErrorDetailsBox>

        <Button onClick={resetErrorBoundary} variant="contained" color="primary">
          Try Again
        </Button>
      </ErrorCard>
    </CenteredContainer>
  );
};

export const GlobalErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.href = '/';
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
