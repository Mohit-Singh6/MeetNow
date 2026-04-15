import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from './shared-theme/AppTheme.jsx';
import SignInCard from './authorization/components/SignInCard.jsx';

export default function Login(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline />

      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundImage:
            'linear-gradient(135deg, hsl(210, 100%, 97%), hsl(250, 100%, 98%), hsl(0, 0%, 100%))',
        }}
      >
        <SignInCard />
      </div>
    </AppTheme>
  );
}