import { createTheme } from '@material-ui/core/styles';
import { red } from '@material-ui/core/colors';
import coreTheme from './coreTheme';

// Create a theme instance.
const theme = createTheme({
  ...coreTheme,
  palette: {
    ...coreTheme.palette,
    background: {
      default: '#fff',
      paper: '#fff'
    },
    primary: {
      main: '#0053FF',
    },
    secondary: {
      main: '#FFFFFF'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.30)',
    },
    type: 'light',
  },
  overrides: {
    ...coreTheme.overrides,
    MuiButton: {
      ...coreTheme.overrides.MuiButton,
      outlined: {
        color: '#fff',
        borderColor: '#fff',
        borderRadius: '32px'
      },
      outlinedPrimary: {
        border: '1px solid #EAEAEA',
        "&:hover": {
          backgroundColor: '#0053FF !important',
          color: '#fff'
        }
      }
    },
    MuiInputBase: {
      ...coreTheme.overrides.MuiInputBase,
      root: {
        background: "#fff"
      }
    },
    MuiOutlinedInput: {
      ...coreTheme.overrides.MuiOutlinedInput,
      notchedOutline: {
        borderWidth: "2px"
      }
    },
    MuiSnackbarContent: {
      root: {
        color: 'rgba(0, 0, 0, 0.87)',
        backgroundColor: '#F8F9FE',
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
