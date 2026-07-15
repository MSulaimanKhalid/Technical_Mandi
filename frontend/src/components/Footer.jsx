import { Box, Container, Typography, Stack } from '@mui/material';
import { colors } from '../styles/theme';
import polarBear from '../assets/polar-bear.svg';

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 10, py: 4, borderTop: `1px solid ${colors.border}`, bgcolor: colors.surface }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box component="img" src={polarBear} alt="" aria-hidden="true" sx={{ width: 34, height: 34, objectFit: 'contain' }} />
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Technical Mandi — useful technology, clearly curated.
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Built with React, Material UI &amp; Django REST Framework.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
