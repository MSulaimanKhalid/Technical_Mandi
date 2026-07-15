import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, Typography, IconButton, Badge, Button,
  Menu, MenuItem, Avatar, Drawer, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, useMediaQuery, useTheme, InputBase, Paper,
} from '@mui/material';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { colors } from '../styles/theme';
import polarBear from '../assets/polar-bear.svg';

export default function Navbar({ onSearch }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, bumpTick } = useCart();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [pop, setPop] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const showSearch = location.pathname === '/' && Boolean(onSearch);

  useEffect(() => {
    if (bumpTick === 0) return undefined;
    setPop(true);
    const timer = setTimeout(() => setPop(false), 440);
    return () => clearTimeout(timer);
  }, [bumpTick]);

  const handleLogout = async () => {
    setMenuAnchor(null);
    await logout();
    navigate('/login', { replace: true });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    onSearch?.(searchValue.trim());
  };

  const navLinks = [
    { label: 'Home', to: '/', icon: <HomeRoundedIcon /> },
    { label: 'My Cart', to: '/cart', icon: <ShoppingCartRoundedIcon /> },
    ...(isAuthenticated
      ? [
          { label: 'My Orders', to: '/orders', icon: <ReceiptLongRoundedIcon /> },
          { label: 'Profile', to: '/profile', icon: <PersonRoundedIcon /> },
        ]
      : []),
  ];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255,255,255,0.94)', color: colors.ink,
          borderBottom: `1px solid ${colors.border}`, backdropFilter: 'blur(14px)',
        }}
      >
        <Toolbar sx={{ gap: 2, py: 1, maxWidth: 1280, width: '100%', mx: 'auto' }}>
          {isMobile && (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ color: colors.ink }}>
              <MenuRoundedIcon />
            </IconButton>
          )}

          <Box
            component={Link}
            to="/"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.1, textDecoration: 'none', color: colors.sageDark }}
          >
            <Box
              sx={{
                width: 42, height: 42, borderRadius: '50%', bgcolor: colors.sageSoft,
                border: `1px solid ${colors.border}`, overflow: 'hidden', display: 'grid', placeItems: 'center',
              }}
            >
              <Box component="img" src={polarBear} alt="" aria-hidden="true" sx={{ width: 42, transform: 'translateY(5px) scale(1.35)' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, display: { xs: 'none', sm: 'block' } }}>
              Technical Mandi
            </Typography>
          </Box>

          {!isMobile && showSearch && (
            <Paper
              component="form"
              onSubmit={submitSearch}
              elevation={0}
              sx={{
                flex: 1, maxWidth: 520, mx: 'auto', display: 'flex', alignItems: 'center',
                px: 2, py: 0.45, borderRadius: 3, bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
              }}
            >
              <SearchRoundedIcon sx={{ color: colors.inkSoft, mr: 1 }} />
              <InputBase
                placeholder="Search Technical Mandi…"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                inputProps={{ 'aria-label': 'Search products' }}
                sx={{ flex: 1, fontFamily: 'Manrope, sans-serif' }}
              />
            </Paper>
          )}

          <Box sx={{ flex: isMobile || !showSearch ? 1 : 'none' }} />

          <IconButton
            component={Link}
            to="/cart"
            className={pop ? 'animate-pop' : ''}
            sx={{ color: colors.sageDark, bgcolor: colors.sageSoft, '&:hover': { bgcolor: colors.sageLight } }}
            aria-label={`Cart with ${totalItems} items`}
          >
            <Badge
              badgeContent={totalItems}
              max={99}
              sx={{ '& .MuiBadge-badge': { bgcolor: colors.sage, color: '#fff', fontWeight: 700 } }}
            >
              <ShoppingCartRoundedIcon />
            </Badge>
          </IconButton>

          {isAuthenticated ? (
            <>
              <IconButton onClick={(event) => setMenuAnchor(event.currentTarget)} sx={{ ml: 0.5 }}>
                <Avatar sx={{ bgcolor: colors.blueDark, fontWeight: 700, width: 38, height: 38 }}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem disabled sx={{ opacity: '1 !important', fontWeight: 700 }}>
                  Hi, {user?.username}
                </MenuItem>
                <Divider />
                <MenuItem component={Link} to="/profile" onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon><PersonRoundedIcon fontSize="small" /></ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem component={Link} to="/orders" onClick={() => setMenuAnchor(null)}>
                  <ListItemIcon><ReceiptLongRoundedIcon fontSize="small" /></ListItemIcon>
                  My Orders
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><LogoutRoundedIcon fontSize="small" /></ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button component={Link} to="/login" variant="contained" startIcon={<LoginRoundedIcon />}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280 }} role="presentation">
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="img" src={polarBear} alt="" aria-hidden="true" sx={{ width: 34 }} />
            <Typography variant="h6">Technical Mandi</Typography>
          </Box>
          <Divider />

          {showSearch && (
            <Box component="form" onSubmit={submitSearch} sx={{ p: 2, display: 'flex', gap: 1 }}>
              <InputBase
                placeholder="Search products…"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                sx={{ flex: 1, px: 1.5, py: 0.5, border: `1px solid ${colors.border}`, borderRadius: 2 }}
              />
              <IconButton type="submit" sx={{ bgcolor: colors.sageSoft }}><SearchRoundedIcon /></IconButton>
            </Box>
          )}

          <List onClick={() => setDrawerOpen(false)}>
            {navLinks.map((link) => (
              <ListItemButton key={link.to} component={Link} to={link.to}>
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            {!isAuthenticated && (
              <ListItemButton component={Link} to="/login">
                <ListItemIcon><LoginRoundedIcon /></ListItemIcon>
                <ListItemText primary="Login / Sign up" />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
