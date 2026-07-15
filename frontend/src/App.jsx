import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  ThemeProvider, CssBaseline, Box, Container, Typography, Chip, Stack,
  Pagination, Skeleton, Alert, Paper, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material';
import EnergySavingsLeafRoundedIcon from '@mui/icons-material/EnergySavingsLeafRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import SentimentDissatisfiedRoundedIcon from '@mui/icons-material/SentimentDissatisfiedRounded';

import theme, { colors } from './styles/theme';
import './styles/global.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import api, { ENDPOINTS } from './services/api';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductCard from './components/ProductCard';
import TopLoadingBar from './components/TopLoadingBar';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';

import heroLandscape from './assets/hero-landscape.svg';
import polarBear from './assets/polar-bear.svg';


const PAGE_SIZE = 12;


function HomePage({ searchTerm }) {
  const { addToCart } = useCart();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.get(ENDPOINTS.categories)
      .then(({ data }) => setCategories(Array.isArray(data) ? data : data.results || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => { setPage(1); }, [activeCategory, searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingProducts(true);
    setErrorMsg('');

    const params = {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    };
    if (activeCategory) params.category = activeCategory;
    if (searchTerm) params.search = searchTerm;

    api.get(ENDPOINTS.products, { params, signal: controller.signal })
      .then(({ data }) => {
        const nextProducts = Array.isArray(data) ? data : data.results || [];
        setProducts(nextProducts);
        setCount(Array.isArray(data) ? data.length : data.count || 0);
      })
      .catch((err) => {
        if (err.name !== 'CanceledError') {
          setErrorMsg('We could not load products right now. Please try again.');
        }
      })
      .finally(() => setLoadingProducts(false));

    return () => controller.abort();
  }, [activeCategory, searchTerm, page]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const handleAddToCart = async (product) => addToCart(product, 1);

  return (
    <>

      <Container maxWidth="lg" sx={{ pt: { xs: 2.5, md: 3.5 }, pb: { xs: 3, md: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            position: 'relative', overflow: 'hidden', minHeight: { xs: 310, md: 330 },
            border: `1px solid ${colors.border}`, bgcolor: colors.surface,
            backgroundImage: `url(${heroLandscape})`, backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <Box
            sx={{
              position: 'relative', zIndex: 2, width: { xs: '100%', md: '64%' },
              p: { xs: 3, sm: 4, md: 5 }, display: 'flex', alignItems: 'center',
              minHeight: { xs: 310, md: 330 },
            }}
          >
            <Stack spacing={1.75} alignItems="flex-start">
              <Chip
                icon={<EnergySavingsLeafRoundedIcon />}
                label="A simpler technology marketplace"
                size="small"
                sx={{ bgcolor: colors.sageLight, color: colors.sageDark }}
              />
              <Typography
                variant="h1"
                sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }, maxWidth: 610 }}
              >
                Useful technology, clearly curated.
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: 560, fontWeight: 400, lineHeight: 1.6 }}
              >
                Browse dependable products, compare details, and keep everything
                in one cart—without the visual noise.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.25} sx={{ pt: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocalShippingRoundedIcon sx={{ color: colors.sage }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">Fast dispatch</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VerifiedRoundedIcon sx={{ color: colors.blueDark }} fontSize="small" />
                  <Typography variant="body2" color="text.secondary">Quality-checked listings</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>

          <Box
            component="img"
            src={polarBear}
            alt="Technical Mandi polar bear mascot"
            className="animate-float"
            sx={{
              position: 'absolute', right: { md: 38, lg: 66 }, bottom: 16,
              width: { md: 185, lg: 210 }, display: { xs: 'none', md: 'block' },
              zIndex: 2, opacity: 0.92,
            }}
          />
        </Paper>
      </Container>


      <Container maxWidth="lg" id="product-grid">

        <FormControl size="small" sx={{ width: { xs: '100%', sm: 300 }, mb: 3 }}>
          <InputLabel id="category-filter-label">Select category</InputLabel>
          <Select
            labelId="category-filter-label"
            id="category-filter"
            value={activeCategory ?? ''}
            label="Select category"
            onChange={(event) => {
              const selectedCategory = event.target.value;
              setActiveCategory(selectedCategory === '' ? null : selectedCategory);
            }}
          >
            <MenuItem value="">All products</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">Explore the mandi</Typography>
            <Typography variant="body2" color="text.secondary">
              Curated products presented with clear details and simple checkout.
            </Typography>
          </Box>
          {searchTerm && (
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: { sm: 'flex-end' } }}>
              Results for “{searchTerm}”
            </Typography>
          )}
        </Stack>

        {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 3,
            minHeight: 300,
            alignItems: 'stretch',
          }}
        >
          {loadingProducts ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Box key={i} sx={{ minWidth: 0 }}>
                <Skeleton variant="rounded" height={235} className="skeleton" sx={{ mb: 1, borderRadius: 3 }} />
                <Skeleton variant="text" height={28} className="skeleton" />
                <Skeleton variant="text" height={20} width="60%" className="skeleton" />
              </Box>
            ))
          ) : products.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Stack alignItems="center" spacing={1} sx={{ py: 8 }}>
                <SentimentDissatisfiedRoundedIcon sx={{ fontSize: 48, color: colors.inkSoft }} />
                <Typography variant="h6">No products found</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try a different search term or category.
                </Typography>
              </Stack>
            </Box>
          ) : (
            products.map((product, index) => (
              <Box key={product.id} sx={{ minWidth: 0, display: 'flex' }}>
                <ProductCard product={product} index={index} onAddToCart={handleAddToCart} />
              </Box>
            ))
          )}
        </Box>

        {!loadingProducts && count > PAGE_SIZE && (
          <Stack alignItems="center" sx={{ my: 5 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => {
                setPage(value);
                document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              color="primary"
              shape="rounded"
              size="large"
            />
          </Stack>
        )}
      </Container>
    </>
  );
}


function AppShell() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const { isAuthenticated } = useAuth();


  const isAuthenticationPage = ['/login', '/signup'].includes(location.pathname);
  const showMarketplaceChrome = isAuthenticated && !isAuthenticationPage;

  const protect = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopLoadingBar />
      {showMarketplaceChrome && <Navbar onSearch={setSearchTerm} />}

      <Box component="main" sx={{ flex: 1 }}>
        <Routes>
          {/* Login and signup are the only routes available without a session. */}
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

          {/* Every marketplace route is protected because the backend returns
              401 for catalogue endpoints until a Bearer token is supplied. */}
          <Route path="/" element={protect(<HomePage searchTerm={searchTerm} />)} />
          <Route path="/products/:id" element={protect(<ProductDetailPage />)} />
          <Route path="/cart" element={protect(<CartPage />)} />
          <Route path="/checkout" element={protect(<CheckoutPage />)} />
          <Route path="/orders" element={protect(<OrdersPage />)} />
          <Route path="/orders/:id" element={protect(<OrderDetailPage />)} />
          <Route path="/profile" element={protect(<ProfilePage />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {showMarketplaceChrome && <Footer />}
    </Box>
  );
}


export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppShell />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
