import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Paper, Box, Typography, TextField, Button, Stack, Alert,
  InputAdornment, IconButton, CircularProgress, Divider,
} from '@mui/material';
import MailRoundedIcon from '@mui/icons-material/MailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';
import { colors } from '../styles/theme';
import polarBear from '../assets/polar-bear.svg';

export default function LoginPage() {
  const { login, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setAuthError(null);
    setSubmitting(true);

    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(
        err,
        'Could not log you in. Check your email and password, then try again.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      className="auth-landscape"
      sx={{
        position: 'relative', minHeight: { xs: 'calc(100vh - 73px)', md: '82vh' },
        display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 5, md: 8 }, overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src={polarBear}
        alt=""
        aria-hidden="true"
        sx={{
          position: 'absolute', left: { lg: '7%' }, bottom: 42, width: 250,
          display: { xs: 'none', lg: 'block' }, opacity: 0.9, zIndex: 1,
        }}
      />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper
          className="animate-rise"
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 }, border: `1px solid ${colors.border}`,
            boxShadow: '0 28px 70px -42px rgba(40,50,54,0.72)',
            bgcolor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(10px)',
          }}
        >
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: colors.sageLight }}>
              <StorefrontRoundedIcon sx={{ color: colors.sageDark, fontSize: 32 }} />
            </Box>
            <Typography variant="h4">Welcome back</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
Sign in to browse Technical Mandi products, manage your cart and track orders.
            </Typography>
          </Stack>

          {(authError || error) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="Email address"
                type="email"
                required
                fullWidth
                autoComplete="email"
                value={form.email}
                onChange={handleChange('email')}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><MailRoundedIcon fontSize="small" /></InputAdornment>,
                }}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange('password')}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockRoundedIcon fontSize="small" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((current) => !current)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.35 }}>
                {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Log in'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>or</Divider>

          <Typography variant="body2" textAlign="center">
            New to Technical Mandi?{' '}
            <Typography
              component={Link}
              to="/signup"
              variant="body2"
              sx={{ color: colors.sageDark, fontWeight: 800, textDecoration: 'none' }}
            >
              Create an account
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
