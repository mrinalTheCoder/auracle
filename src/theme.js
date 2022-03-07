import {createTheme} from "@mui/material/styles";

let theme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#fb8c00',
    },
    secondary: {
      main: '#0277bd',
    },
    info: {
      main: '#676767',
    },
  },
  typography: {
    fontFamily: 'Roboto',
    fontSize: 15,
    h1: {
      fontSize: '4.7rem',
    },
    h2: {
      fontSize: '3.7rem',
    },
  }
});

export default theme;
