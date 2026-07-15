import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Box, Typography, TextField, Button, Stack, Alert,
  InputAdornment, IconButton, CircularProgress, Divider, LinearProgress, AlertTitle,
} from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import MailRoundedIcon from '@mui/icons-material/MailRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessages } from '../services/api';
import { colors } from '../styles/theme';
import polarBear from '../assets/polar-bear.svg';

function estimateStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 5);
}

const STRENGTH_COLORS = [
  colors.error,
  colors.error,
  colors.warm,
  colors.blueDark,
  colors.sage,
  colors.sageDark,
];
const STRENGTH_LABELS = ['Very weak', 'Very weak', 'Weak', 'Okay', 'Strong', 'Very strong'];

function buildSignupError(error) {
  const status = error?.response?.status;
  const messages = getApiErrorMessages(
    error,
    'Could not create your account. Please review your details and try again.',
  );

  if (status === 404) {
    return {
      title: 'Account creation is temporarily unavailable',
      messages,
    };
  }

  if (status >= 500) {
    return {
      title: 'The server could not create your account',
      messages,
    };
  }

  return {
    title: 'Please check the following',
    messages,
  };
}

export default function SignupPage() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const strength = estimateStrength(form.password);
  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (form.password !== form.password2) {
      setError({ title: 'Please check the following', messages: ['Passwords do not match.'] });
      return;
    }
    if (form.password.length < 8) {
      setError({ title: 'Please check the following', messages: ['Password must be at least 8 characters long.'] });
      return;
    }

    setSubmitting(true);
    try {
      await signup(form);
      await login({ email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(buildSignupError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      className="auth-landscape"
      sx={{
        position: 'relative', minHeight: { xs: 'calc(100vh - 73px)', md: '90vh' },
        display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 5, md: 8 }, overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src={polarBear}
        alt=""
        aria-hidden="true"
        sx={{
          position: 'absolute', right: { lg: '7%' }, bottom: 44, width: 230,
          transform: 'scaleX(-1)', display: { xs: 'none', lg: 'block' }, opacity: 0.9, zIndex: 1,
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
            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: colors.blueLight }}>
              <StorefrontRoundedIcon sx={{ color: colors.sageDark, fontSize: 32 }} />
            </Box>
            <Typography variant="h4">Create your account</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
Create an account to browse Technical Mandi, add products to your cart and place orders.
            </Typography>
          </Stack>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                bgcolor: colors.errorLight,
                color: colors.errorDark,
                border: `1px solid ${colors.error}55`,
                alignItems: 'flex-start',
                '& .MuiAlert-icon': { color: colors.errorDark },
                '& .MuiAlert-message': {
                  display: 'block',
                  minWidth: 0,
                  color: colors.errorDark,
                  fontWeight: 650,
                  lineHeight: 1.5,
                  overflowWrap: 'anywhere',
                },
              }}
            >
              <AlertTitle sx={{ fontWeight: 800, mb: 0.5 }}>{error.title}</AlertTitle>
              {error.messages.length === 1 ? (
                <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 600 }}>
                  {error.messages[0]}
                </Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                  {error.messages.map((message) => (
                    <Typography
                      component="li"
                      variant="body2"
                      key={message}
                      sx={{ color: 'inherit', fontWeight: 600, mb: 0.35 }}
                    >
                      {message}
                    </Typography>
                  ))}
                </Box>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.25}>
              <TextField
                label="Username"
                required
                fullWidth
                autoComplete="username"
                value={form.username}
                onChange={handleChange('username')}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PersonRoundedIcon fontSize="small" /></InputAdornment>,
                }}
              />
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
              <Box>
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  autoComplete="new-password"
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
                {form.password && (
                  <Box sx={{ mt: 0.8 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(strength / 5) * 100}
                      sx={{ '& .MuiLinearProgress-bar': { bgcolor: STRENGTH_COLORS[strength] } }}
                    />
                    <Typography variant="caption" sx={{ color: STRENGTH_COLORS[strength] }}>
                      {STRENGTH_LABELS[strength]}
                    </Typography>
                  </Box>
                )}
              </Box>
              <TextField
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="new-password"
                value={form.password2}
                onChange={handleChange('password2')}
                error={form.password2.length > 0 && form.password2 !== form.password}
                helperText={form.password2.length > 0 && form.password2 !== form.password ? 'Passwords do not match' : ' '}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockRoundedIcon fontSize="small" /></InputAdornment>,
                }}
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ py: 1.35 }}>
                {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Create account'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>or</Divider>

          <Typography variant="body2" textAlign="center">
            Already have an account?{' '}
            <Typography
              component={Link}
              to="/login"
              variant="body2"
              sx={{ color: colors.sageDark, fontWeight: 800, textDecoration: 'none' }}
            >
              Log in
            </Typography>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
