import { useState } from 'react';
import {
  Card, CardMedia, CardContent, CardActions, Typography, Box, Chip,
  IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import AddShoppingCartRoundedIcon from '@mui/icons-material/AddShoppingCartRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import { Link } from 'react-router-dom';
import { colors } from '../styles/theme';

export default function ProductCard({ product, index = 0, onAddToCart }) {
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const imageUrl = product.primary_image?.image || null;

  const handleAdd = async () => {
    setAdding(true);
    const result = await onAddToCart(product);
    setAdding(false);

    if (result?.ok) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    }
  };

  return (
    <Card
      className="animate-rise"
      sx={{
        width: '100%', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column',
        animationDelay: `${Math.min(index, 8) * 60}ms`,
        '&:hover': {
          transform: 'translateY(-5px)', borderColor: colors.blueDark,
          boxShadow: '0 22px 38px -28px rgba(40,50,54,0.75)',
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component={Link}
          to={`/products/${product.id}`}
          sx={{
            height: 235, backgroundColor: colors.blueLight,
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {!imageUrl && <InventoryRoundedIcon sx={{ fontSize: 56, color: colors.blueDark }} />}
        </CardMedia>

        <Chip
          label={product.category_name}
          size="small"
          sx={{
            position: 'absolute', top: 10, left: 10,
            bgcolor: 'rgba(255,255,255,0.92)', color: colors.sageDark,
            border: `1px solid ${colors.border}`,
          }}
        />

        {!product.is_available && (
          <Chip
            label="Sold out"
            size="small"
            sx={{ position: 'absolute', top: 10, right: 10, bgcolor: colors.error, color: '#fff' }}
          />
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          component={Link}
          to={`/products/${product.id}`}
          variant="subtitle1"
          sx={{ fontWeight: 800, color: colors.ink, textDecoration: 'none', display: 'block', mb: 0.5 }}
        >
          {product.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {product.description || 'No description provided.'}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="overline" sx={{ fontSize: '1.02rem', color: colors.sageDark }}>
          ${Number(product.price).toFixed(2)}
        </Typography>

        <Tooltip title={justAdded ? 'Added!' : 'Add to cart'}>
          <span>
            <IconButton
              onClick={handleAdd}
              disabled={!product.is_available || adding}
              sx={{
                bgcolor: justAdded ? colors.blueDark : colors.sage,
                color: '#fff', transition: 'background-color 180ms ease',
                '&:hover': { bgcolor: justAdded ? colors.sage : colors.sageDark },
                '&.Mui-disabled': { bgcolor: colors.surfaceMuted },
              }}
            >
              {adding
                ? <CircularProgress size={20} sx={{ color: '#fff' }} />
                : justAdded ? <CheckCircleRoundedIcon /> : <AddShoppingCartRoundedIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
