import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Paper, Typography, TextField, Button, Stack, Alert,
  Divider, CircularProgress, List, ListItem, ListItemText, Box,
} from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api, { ENDPOINTS, getApiErrorMessage } from '../services/api';
import { colors } from '../styles/theme';

const EMPTY_ADDRESS = { full_name: '', email: '', address: '', city: '', postal_code: '', country: '' };

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, cartTotal, refreshServerCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...EMPTY_ADDRESS, full_name: user?.username || '', email: user?.email || '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasEditedAddressRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function prefillFromLastOrder() {
      try {

        const { data } = await api.get(ENDPOINTS.orders, {
          params: { limit: 1, offset: 0 },
        });
        const orders = Array.isArray(data) ? data : (data.results || []);
        const latestOrder = orders[0];

        if (!latestOrder || cancelled || hasEditedAddressRef.current) return;

        let shippingAddress = latestOrder.shipping_address;
        if (!shippingAddress) {
          const detailResponse = await api.get(ENDPOINTS.orderDetail(latestOrder.id));
          shippingAddress = detailResponse.data?.shipping_address;
        }

        if (!shippingAddress || cancelled || hasEditedAddressRef.current) return;

        setForm((current) => ({
          ...current,
          full_name: shippingAddress.full_name || current.full_name,
          email: shippingAddress.email || current.email,
          address: shippingAddress.address || '',
          city: shippingAddress.city || '',
          postal_code: shippingAddress.postal_code || '',
          country: shippingAddress.country || '',
        }));
      } catch {

      }
    }

    prefillFromLastOrder();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleChange = (field) => (e) => {
    hasEditedAddressRef.current = true;
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post(ENDPOINTS.checkout, form);
      await refreshServerCart(); // cart is now empty server-side; sync local state
      navigate(`/orders/${data.order.id}`, { state: { justPlaced: true }, replace: true });
    } catch (err) {
      setError(getApiErrorMessage(
        err,
        'We could not place your order. Review the shipping information and try again.',
      ));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <LocalShippingRoundedIcon sx={{ fontSize: 34, color: colors.sage }} />
        <Typography variant="h3">Checkout</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* ---- Shipping form ---- */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 4, border: `1px solid ${colors.border}` }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Shipping address</Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField label="Full name" required fullWidth value={form.full_name} onChange={handleChange('full_name')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Email" type="email" required fullWidth value={form.email} onChange={handleChange('email')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Street address" required fullWidth value={form.address} onChange={handleChange('address')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="City" required fullWidth value={form.city} onChange={handleChange('city')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Postal code" required fullWidth value={form.postal_code} onChange={handleChange('postal_code')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Country" required fullWidth value={form.country} onChange={handleChange('country')} />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting || items.length === 0}
                sx={{ mt: 4, py: 1.5 }}
              >
                {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : `Place order — $${cartTotal.toFixed(2)}`}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* ---- Order review ---- */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, border: `1px solid ${colors.blueDark}`, bgcolor: colors.blueSoft }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Review your order</Typography>
            <List dense>
              {items.map((item) => (
                <ListItem key={item.productId} disableGutters
                  secondaryAction={<Typography sx={{ fontFamily: "'JetBrains Mono', monospace" }}>${item.lineTotal.toFixed(2)}</Typography>}
                >
                  <ListItemText primary={item.product.name} secondary={`Qty ${item.quantity}`} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>${cartTotal.toFixed(2)}</Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}