import {useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

export function HeaderBar(props) {
  const [state, setState] = useState(false);

  return (
    <>
      <Drawer
        anchor={'left'}
        onClose={() => {setState(false)}}
        open={state}
        onOpen={() => {setState(false)}}
      >
      <Box
        sx={{ width: 250 }}
        role="presentation"
        onClick={() => {setState(false)}}
        onKeyDown={() => {setState(false)}}
      >
        Hello
      </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={() => {
                setState(true);
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {props.title}
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>
    </>
  );
}
