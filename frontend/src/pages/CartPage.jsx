import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Stack, IconButton, Button, Divider,
  Paper, Chip, CircularProgress,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import { useCart } from '../context/CartContext';
import { colors } from '../styles/theme';

export default function CartPage() {
  const { items, cartTotal, totalItems, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <ShoppingCartRoundedIcon sx={{ fontSize: 72, color: colors.inkSoft }} />
        <Typography variant="h4" sx={{ mt: 2 }}>Your cart is empty</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Useful products are only a click away — explore Technical Mandi when you are ready.
        </Typography>
        <Button component={Link} to="/" variant="contained" color="primary" size="large">
          Browse products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h3">Your cart</Typography>
        <Button color="error" onClick={clearCart} disabled={loading} startIcon={<DeleteOutlineRoundedIcon />}>
          Clear cart
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Typography>


      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
        {/* ---- Line items ---- */}
        <Stack spacing={2} sx={{ flex: 2, width: '100%' }}>
          {items.map((item) => (
            <Paper
              key={item.productId}
              className="animate-rise"
              elevation={0}
              sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', border: `1px solid ${colors.border}` }}
            >
              <Box
                sx={{
                  width: 84, height: 84, borderRadius: 3, flexShrink: 0, bgcolor: colors.blueLight,
                  backgroundImage: item.product.primary_image?.image ? `url(${item.product.primary_image.image})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {!item.product.primary_image?.image && <InventoryRoundedIcon sx={{ color: colors.blueDark }} />}
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  component={Link}
                  to={`/products/${item.productId}`}
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: colors.ink, textDecoration: 'none' }}
                  noWrap
                >
                  {item.product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ${Number(item.product.price).toFixed(2)} each
                </Typography>
              </Box>

              <Stack direction="row" alignItems="center" sx={{ border: `1px solid ${colors.border}`, borderRadius: 999 }}>
                <IconButton
                  size="small"
                  disabled={loading || item.quantity <= 1}
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <RemoveRoundedIcon fontSize="small" />
                </IconButton>
                <Typography sx={{ px: 1.5, minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</Typography>
                <IconButton size="small" disabled={loading} onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                  <AddRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Typography sx={{ width: 80, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                ${item.lineTotal.toFixed(2)}
              </Typography>

              <IconButton color="error" disabled={loading} onClick={() => removeFromCart(item.productId)}>
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Paper>
          ))}
        </Stack>

        <Paper
          elevation={0}
          sx={{ flex: 1, width: '100%', p: 3, position: { md: 'sticky' }, top: { md: 88 }, border: `1px solid ${colors.border}`, bgcolor: colors.sageSoft }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>Order summary</Typography>
          <Stack spacing={1.2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography sx={{ fontFamily: "'JetBrains Mono', monospace" }}>${cartTotal.toFixed(2)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Shipping</Typography>
              <Chip label="Free" size="small" sx={{ bgcolor: colors.sageDark, color: '#fff', fontWeight: 700 }} />
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" sx={{ fontFamily: "'JetBrains Mono', monospace" }}>${cartTotal.toFixed(2)}</Typography>
            </Stack>
          </Stack>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate('/checkout')}
            disabled={loading}
            endIcon={loading ? null : <ArrowForwardRoundedIcon />}
            sx={{ mt: 3, py: 1.4 }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Proceed to checkout'}
          </Button>
        </Paper>
      </Stack>
    </Container>
  );
}
