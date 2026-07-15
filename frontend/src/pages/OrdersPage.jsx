import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Stack, Paper, Chip, Box, Skeleton, Pagination,
  Divider, Button,
} from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import api, { ENDPOINTS } from '../services/api';
import { colors } from '../styles/theme';

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  pending: { bg: colors.blueLight, fg: colors.blueDark },
  completed: { bg: colors.sageLight, fg: colors.sageDark },
  cancelled: { bg: colors.errorLight, fg: colors.errorDark },
  shipping: { bg: colors.blueLight, fg: colors.blueDark },
  delivered: { bg: colors.sageLight, fg: colors.sageDark },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(ENDPOINTS.orders, { params: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE } })
      .then(({ data }) => {
        if (Array.isArray(data)) { setOrders(data); setCount(data.length); }
        else { setOrders(data.results || []); setCount(data.count || 0); }
      })
      .finally(() => setLoading(false));
  }, [page]);

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <ReceiptLongRoundedIcon sx={{ fontSize: 34, color: colors.blueDark }} />
        <Typography variant="h3">My orders</Typography>
      </Stack>

      {loading ? (
        <Stack spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={90} className="skeleton" sx={{ borderRadius: 4 }} />
          ))}
        </Stack>
      ) : orders.length === 0 ? (
        <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
          <ReceiptLongRoundedIcon sx={{ fontSize: 56, color: colors.inkSoft }} />
          <Typography variant="h6">No orders yet</Typography>
          <Typography color="text.secondary">Once you check out, your orders will show up here.</Typography>
          <Button component={Link} to="/" variant="contained" color="primary">Start shopping</Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {orders.map((order) => {
            const style = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
            return (
              <Paper
                key={order.id}
                component={Link}
                to={`/orders/${order.id}`}
                className="animate-rise"
                elevation={0}
                sx={{
                  p: 3, display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', color: 'inherit',
                  border: `1px solid ${colors.border}`, '&:hover': { borderColor: colors.blueDark, bgcolor: colors.blueSoft },
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Order #{order.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>
                <Chip label={order.status} sx={{ bgcolor: style.bg, color: style.fg, fontWeight: 700, textTransform: 'capitalize' }} />
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, minWidth: 90, textAlign: 'right' }}>
                  ${Number(order.total_amount).toFixed(2)}
                </Typography>
                <ChevronRightRoundedIcon sx={{ color: colors.inkSoft }} />
              </Paper>
            );
          })}
        </Stack>
      )}

      {!loading && count > PAGE_SIZE && (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} color="secondary" shape="rounded" />
        </Stack>
      )}
    </Container>
  );
}
