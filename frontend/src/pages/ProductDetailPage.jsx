import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container, Grid, Box, Typography, Chip, Stack, Button, IconButton,
  Skeleton, Alert, Breadcrumbs, Divider, CircularProgress, Dialog,
  DialogContent, Tooltip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import api, { ENDPOINTS } from '../services/api';
import { useCart } from '../context/CartContext';
import { colors } from '../styles/theme';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState('');
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get(ENDPOINTS.productDetail(id))
      .then(({ data }) => { setProduct(data); setActiveImage(0); })
      .catch(() => setError('This product could not be found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    setAdding(true);
    setAddedMsg('');
    const result = await addToCart(product, quantity);
    setAdding(false);
    setAddedMsg(result?.ok ? `Added ${quantity} to your cart!` : (result?.message || 'Could not add to cart.'));
  };

  const stock = product?.inventory?.stock_quantity;
  const isLowStock = product?.inventory?.is_low_stock;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={420} className="skeleton" /></Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="text" height={50} width="80%" className="skeleton" />
            <Skeleton variant="text" height={30} width="40%" className="skeleton" />
            <Skeleton variant="text" height={100} className="skeleton" />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        <Button component={Link} to="/" sx={{ mt: 2 }}>← Back to shopping</Button>
      </Container>
    );
  }

  const images = product.images?.length ? product.images : [{ id: 'placeholder', image: null, alt_text: product.name }];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Typography component={Link} to="/" sx={{ textDecoration: 'none', color: colors.inkSoft }}>Home</Typography>
        <Typography color="text.secondary">{product.category_name}</Typography>
        <Typography color="text.primary" fontWeight={700}>{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={5}>
   
        <Grid item xs={12} md={6}>
          <Box
            component={images[activeImage]?.image ? 'button' : 'div'}
            type={images[activeImage]?.image ? 'button' : undefined}
            onClick={images[activeImage]?.image ? () => setZoomOpen(true) : undefined}
            className="animate-rise"
            aria-label={images[activeImage]?.image ? `Zoom ${images[activeImage].alt_text || product.name}` : undefined}
            sx={{
              width: '100%', height: 420, borderRadius: 6, overflow: 'hidden', mb: 2, p: 0,
              bgcolor: colors.blueLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${colors.border}`,
              cursor: images[activeImage]?.image ? 'zoom-in' : 'default',
              position: 'relative',
              '&:focus-visible': { outline: `3px solid ${colors.sage}`, outlineOffset: 3 },
            }}
          >
            {images[activeImage]?.image ? (
              <>
                <Box
                  component="img"
                  src={images[activeImage].image}
                  alt={images[activeImage].alt_text || product.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
                <Tooltip title="Click to enlarge">
                  <Box
                    sx={{
                      position: 'absolute', right: 14, bottom: 14, width: 42, height: 42,
                      borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.92)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: colors.sageDark, boxShadow: '0 8px 22px rgba(31,50,52,0.18)',
                    }}
                  >
                    <ZoomInRoundedIcon />
                  </Box>
                </Tooltip>
              </>
            ) : (
              <InventoryRoundedIcon sx={{ fontSize: 90, color: colors.blueDark }} />
            )}
          </Box>

          {images.length > 1 && (
            <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 0.5 }}>
              {images.map((img, i) => (
                <Box
                  component="button"
                  type="button"
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show ${img.alt_text || `${product.name} image ${i + 1}`}`}
                  sx={{
                    width: 72, height: 72, borderRadius: 3, cursor: 'pointer', p: 0,
                    flexShrink: 0, overflow: 'hidden', bgcolor: colors.blueLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: i === activeImage ? `3px solid ${colors.sage}` : `1px solid ${colors.border}`,
                    '&:focus-visible': { outline: `3px solid ${colors.sage}`, outlineOffset: 2 },
                  }}
                >
                  {img.image ? (
                    <Box
                      component="img"
                      src={img.image}
                      alt={img.alt_text || `${product.name} image ${i + 1}`}
                      sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <InventoryRoundedIcon sx={{ color: colors.blueDark }} />
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Chip label={product.category_name} sx={{ bgcolor: colors.blueLight, color: colors.sageDark, fontWeight: 700, mb: 2 }} />
          <Typography variant="h3" sx={{ mb: 1 }}>{product.name}</Typography>
          <Typography variant="h4" sx={{ color: colors.sageDark, fontFamily: "'JetBrains Mono', monospace", mb: 2 }}>
            ${Number(product.price).toFixed(2)}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
            {product.is_available && stock > 0 ? (
              <Chip icon={<CheckCircleRoundedIcon />} label={isLowStock ? `Only ${stock} left` : 'In stock'}
                sx={{ bgcolor: isLowStock ? colors.warmLight : colors.sageLight, color: isLowStock ? colors.warmDark : colors.sageDark, fontWeight: 700 }} />
            ) : (
              <Chip icon={<WarningAmberRoundedIcon />} label="Out of stock" sx={{ bgcolor: colors.errorLight, color: colors.errorDark, fontWeight: 700 }} />
            )}
          </Stack>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
            {product.description || 'No description provided for this product yet.'}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" alignItems="center" sx={{ border: `1px solid ${colors.border}`, borderRadius: 999 }}>
              <IconButton size="small" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><RemoveRoundedIcon /></IconButton>
              <Typography sx={{ px: 2, minWidth: 32, textAlign: 'center', fontWeight: 700 }}>{quantity}</Typography>
              <IconButton size="small" onClick={() => setQuantity((q) => Math.min(stock ?? 99, q + 1))}><AddRoundedIcon /></IconButton>
            </Stack>

            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={adding ? null : <AddShoppingCartRoundedIcon />}
              disabled={!product.is_available || stock === 0 || adding}
              onClick={handleAdd}
              sx={{ flex: 1, py: 1.4 }}
            >
              {adding ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Add to cart'}
            </Button>
          </Stack>

          {addedMsg && (
            <Alert
              severity={addedMsg.startsWith('Added') ? 'success' : 'warning'}
              sx={{ mt: 2, borderRadius: 3 }}
              onClose={() => setAddedMsg('')}
            >
              {addedMsg}
            </Alert>
          )}
        </Grid>
      </Grid>


      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 5,
            bgcolor: colors.surface,
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
          },
        }}
      >
        <IconButton
          aria-label="Close enlarged image"
          onClick={() => setZoomOpen(false)}
          sx={{
            position: 'absolute', top: 12, right: 12, zIndex: 1,
            bgcolor: 'rgba(255,255,255,0.94)', color: colors.ink,
            boxShadow: '0 6px 18px rgba(31,50,52,0.16)',
            '&:hover': { bgcolor: '#fff' },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <DialogContent
          sx={{
            p: { xs: 2, sm: 3 }, minHeight: { xs: 320, sm: 520 },
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: colors.blueLight,
          }}
        >
          {images[activeImage]?.image && (
            <Box
              component="img"
              src={images[activeImage].image}
              alt={images[activeImage].alt_text || product.name}
              sx={{
                display: 'block', maxWidth: '100%', width: 'auto',
                maxHeight: '78vh', height: 'auto', objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}