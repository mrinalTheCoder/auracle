import {useState} from 'react';
import { useCookies } from 'react-cookie';
import {db} from './firebase.js';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import IconButton from '@mui/material/IconButton';

import MenuIcon from '@mui/icons-material/Menu';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

export function ProfileCard(props) {
  const data = props.data;
  const [cookies, setCookie, removeCookie] = useCookies(['pid', 'uid']);

  return (
    <Card>
      {props.imgSrc ?
        <Avatar alt="profile" src={props.imgSrc}
          onClick={() => {
            setCookie('pid', props.id);
            setCookie('name', data.name);
            setCookie('dob', data.dob);
            setCookie('dp1', props.imgSrc.substring(0, 50000));
            setCookie('dp2', props.imgSrc.substring(50000, -1));
            window.location = "/menu";
          }}
        /> :
        <Avatar alt="profile" onClick={() => {
          setCookie('pid', props.id);
          setCookie('name', data.name);
          setCookie('dob', data.dob);
          window.location = "/dashboard";
        }}>
          {data.name.charAt(0)}
        </Avatar>
      }
      <CardContent className={"card-style"}>
        <Typography>{data.name}</Typography>
        <Typography>{data.dob}</Typography>
      </CardContent>
      <Box display="flex" flexDirection="row" alignItems="center">
        <button className="button" onClick={() => {
          window.location = "/qrcode"
        }}>
          QR
        </button>
        <IconButton onClick={() => {
          window.location = "/edit-profile/?pid=" + props.id;
        }}>
          <EditIcon />
        </IconButton>
        {props.showDelete ?
          <IconButton onClick={async function () {
            await db
              .collection(cookies.uid)
              .doc(cookies.pid)
              .delete();
            removeCookie('pid');

          }}>
            <DeleteIcon />
          </IconButton> :
          <></>
        }
      </Box>
    </Card>
  );
}

export function Title(props) {
  return (<Typography>{props.pageTitle}</Typography>);
}
