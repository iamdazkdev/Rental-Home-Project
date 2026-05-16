import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main:        '#F8395A',  // $pinkred
      dark:        '#d42e4a',
      light:       '#fb6b84',
      contrastText:'#ffffff',
    },
    secondary: {
      main:        '#24355A',  // $blue
      dark:        '#182440',
      light:       '#3d5080',
      contrastText:'#ffffff',
    },
    success: {
      main: '#4CAF50',         // $success
    },
    background: {
      default: '#F7F8F8',      // $lightgrey
      paper:   '#ffffff',
    },
    text: {
      secondary: '#969393',    // $darkgrey
      disabled:  '#bdb9b9',    // $grey
    },
  },
  typography: {
    fontFamily: '"Inter", "Manrope", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    button: {
      textTransform: 'none',   // Không viết hoa tự động
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 10,          // Theo SCSS mixin hiện có
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 3px 10px 2px rgba(0,0,0,0.2)' }, // $shadow mixin
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
  },
});

export default theme;
