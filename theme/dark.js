import { createTheme } from '@material-ui/core/styles';
import coreTheme from './coreTheme';

// Create a theme instance.
const theme = createTheme({
  ...coreTheme,
  palette: {
    ...coreTheme.palette,
    background: {
      default: '#141C2F',
      paper: '#1C253C'
    },
    primary: {
      main: '#2F80ED',
    },
    secondary: {
      main: '#141C2F'
    },
    type: 'dark',
  },
  overrides: {
    ...coreTheme.overrides,
    MuiButton: {
      ...coreTheme.overrides.MuiButton,
      outlinedPrimary: {
        border: '1px solid #FFFFFF1A',
        "&:hover": {
          backgroundColor: '#2F80ED !important',
          color: '#fff'
        }
      }
    },
    MuiInputBase: {
      ...coreTheme.overrides.MuiInputBase,
      root: {
        background: "#141C2F"
      }
    },
    MuiOutlinedInput: {
      ...coreTheme.overrides.MuiOutlinedInput,
      notchedOutline: {
        borderColor: "#31394F"
      }
    },
    MuiSnackbarContent: {
      root: {
        color: '#fff',
        backgroundColor: '#2B2E3C',
        padding: '0px',
        minWidth: 'auto',
        '@media (min-width: 960px)': {
          minWidth: '500px',
        }
      },
      message: {
        padding: '0px'
      },
      action: {
        marginRight: '0px'
      }
    },
  }
});

export default theme;
