import { useEffect, useState } from 'react';
import { LinearProgress, Box } from '@mui/material';
import { subscribeToLoading } from '../services/api';
import { colors } from '../styles/theme';

export default function TopLoadingBar() {
  const [active, setActive] = useState(false);

  useEffect(() => subscribeToLoading((count) => setActive(count > 0)), []);

  if (!active) return null;

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.tooltip + 1 }}>
      <LinearProgress
        sx={{
          height: 3, borderRadius: 0, bgcolor: 'transparent',
          '& .MuiLinearProgress-bar': {
            background: `linear-gradient(90deg, ${colors.sageDark}, ${colors.sage}, ${colors.blue})`,
          },
        }}
      />
    </Box>
  );
}
