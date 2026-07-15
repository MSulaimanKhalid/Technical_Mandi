import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Stack, Chip, Divider, List, ListItem,
  ListItemText, Skeleton, Alert, Grid, Box, Button,
} from '@mui/material';
import CelebrationRoundedIcon from '@mui/icons-material/CelebrationRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import api, { ENDPOINTS } from '../services/api';
import { colors } from '../styles/theme';

const STATUS_STYLES = {
  pending: { bg: colors.blueLight, fg: colors.blueDark },
  completed: { bg: colors.sageLight, fg: colors.sageDark },
  cancelled: { bg: colors.errorLight, fg: colors.errorDark },
  shipping: { bg: colors.blueLight, fg: colors.blueDark },
  delivered: { bg: colors.sageLight, fg: colors.sageDark },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const justPlaced = location.state?.justPlaced;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(ENDPOINTS.orderDetail(id))
      .then(({ data }) => setOrder(data))
      .catch(() => setError('This order could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Skeleton variant="text" height={60} width="50%" className="skeleton" />
        <Skeleton variant="rounded" height={220} className="skeleton" sx={{ mt: 2, borderRadius: 4 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        <Button component={Link} to="/orders" sx={{ mt: 2 }}>← Back to orders</Button>
      </Container>
    );
  }

  const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {justPlaced && (
        <Alert
          icon={<CelebrationRoundedIcon />}
          severity="success"
          className="animate-rise"
          sx={{ mb: 3, borderRadius: 3, bgcolor: colors.sageLight, color: colors.sageDark, fontWeight: 600 }}
        >
          Order placed successfully! We'll get it ready right away.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h3">Order #{order.id}</Typography>
        <Chip label={order.status} sx={{ bgcolor: style.bg, color: style.fg, fontWeight: 700, textTransform: 'capitalize' }} />
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${colors.border}` }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
            <List>
              {order.order_items.map((item) => (
                <ListItem key={item.id} disableGutters
                  secondaryAction={<Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>${Number(item.line_total).toFixed(2)}</Typography>}
                >
                  <ListItemText primary={item.product_name} secondary={`Qty ${item.quantity} × $${Number(item.unit_price).toFixed(2)}`} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">Total paid</Typography>
              <Typography variant="h6" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>${Number(order.total_amount).toFixed(2)}</Typography>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${colors.blueDark}`, bgcolor: colors.blueSoft }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <LocationOnRoundedIcon sx={{ color: colors.blueDark }} />
              <Typography variant="h6">Shipping to</Typography>
            </Stack>
            {order.shipping_address ? (
              <Box>
                <Typography fontWeight={700}>{order.shipping_address.full_name}</Typography>
                <Typography color="text.secondary">{order.shipping_address.address}</Typography>
                <Typography color="text.secondary">
                  {order.shipping_address.city}, {order.shipping_address.postal_code}
                </Typography>
                <Typography color="text.secondary">{order.shipping_address.country}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>{order.shipping_address.email}</Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">No shipping address on file.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Button component={Link} to="/orders" sx={{ mt: 4 }}>← Back to all orders</Button>
    </Container>
  );
}
