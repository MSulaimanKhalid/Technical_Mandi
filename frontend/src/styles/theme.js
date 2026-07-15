import { createTheme } from '@mui/material/styles';

export const colors = {
  sage: '#587880',
  sageDark: '#36565D',
  sageLight: '#DDE9E7',
  sageSoft: '#F1F6F5',

  blue: '#AFDAE0',
  blueDark: '#6EABB4',
  blueLight: '#EAF6F8',
  blueSoft: '#F5FBFC',

  warm: '#B48955',
  warmDark: '#87643E',
  warmLight: '#F6EEDF',

  error: '#B85C63',
  errorDark: '#8F4047',
  errorLight: '#F9E8EA',

  background: '#F7F9F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F4F3',
  border: '#DDE6E5',
  ink: '#283236',
  inkSoft: '#667478',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.sage,
      dark: colors.sageDark,
      light: colors.sageLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.blueDark,
      dark: colors.sage,
      light: colors.blueLight,
      contrastText: '#FFFFFF',
    },
    info: {
      main: colors.blueDark,
      light: colors.blueLight,
      dark: colors.sage,
    },
    warning: {
      main: colors.warm,
      dark: colors.warmDark,
      light: colors.warmLight,
    },
    error: {
      main: colors.error,
      dark: colors.errorDark,
      light: colors.errorLight,
    },
    success: {
      main: colors.sage,
      dark: colors.sageDark,
      light: colors.sageLight,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.ink,
      secondary: colors.inkSoft,
    },
    divider: colors.border,
  },

  typography: {
    fontFamily: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600, letterSpacing: '-0.035em' },
    h2: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600, letterSpacing: '-0.025em' },
    h3: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontFamily: "'Lora', Georgia, serif", fontWeight: 600 },
    h5: { fontFamily: "'Manrope', sans-serif", fontWeight: 700 },
    h6: { fontFamily: "'Manrope', sans-serif", fontWeight: 700 },
    button: { fontFamily: "'Manrope', sans-serif", fontWeight: 700, textTransform: 'none' },
    overline: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: '0.035em' },
  },

  shape: {
    borderRadius: 16,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 24px -14px rgba(40,50,54,0.45)',
          },
          '&:active': { transform: 'translateY(0) scale(0.99)' },
        },
        containedPrimary: {
          backgroundColor: colors.sage,
          color: '#FFFFFF',
          '&:hover': { backgroundColor: colors.sageDark },
        },
        containedSecondary: {
          backgroundColor: colors.blueDark,
          color: '#FFFFFF',
          '&:hover': { backgroundColor: colors.sage },
        },
        outlinedPrimary: {
          borderColor: colors.sage,
          color: colors.sageDark,
          '&:hover': {
            borderColor: colors.sageDark,
            backgroundColor: colors.sageSoft,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 14px 32px -26px rgba(40,50,54,0.55)',
          transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 20,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 12, fontWeight: 700 },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: colors.surface,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.blueDark },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.sage,
            borderWidth: 2,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 999, height: 5 },
      },
    },
  },
});

export default theme;