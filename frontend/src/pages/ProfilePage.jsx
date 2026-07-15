import { Link } from 'react-router-dom';
import {
  Container, Paper, Avatar, Typography, Stack, Grid, Box, Chip, Button, Divider,
} from '@mui/material';
import MailRoundedIcon from '@mui/icons-material/MailRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/theme';

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.4 }}>
      <Box sx={{ color: colors.blueDark }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body1" fontWeight={600}>{value}</Typography>
      </Box>
    </Stack>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={0} className="animate-rise" sx={{ p: { xs: 3, sm: 5 }, border: `1px solid ${colors.border}` }}>
        <Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar sx={{ width: 84, height: 84, bgcolor: colors.sage, color: '#fff', fontSize: 32, fontWeight: 700 }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Typography variant="h4">{user?.username}</Typography>
          <Chip
            icon={<VerifiedUserRoundedIcon />}
            label={user?.is_staff ? 'Staff account' : 'Verified member'}
            sx={{ bgcolor: colors.sageLight, color: colors.sageDark, fontWeight: 700 }}
          />
        </Stack>

        <Divider sx={{ mb: 1 }} />

        <InfoRow icon={<MailRoundedIcon />} label="Email address" value={user?.email} />
        <Divider />
        <InfoRow icon={<BadgeRoundedIcon />} label="Username" value={user?.username} />
        <Divider />
        <InfoRow
          icon={<EventRoundedIcon />}
          label="Member since"
          value={user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
        />

        <Button
          component={Link}
          to="/orders"
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<ReceiptLongRoundedIcon />}
          sx={{ mt: 4, py: 1.3 }}
        >
          View my orders
        </Button>
      </Paper>
    </Container>
  );
}
