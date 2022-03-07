import {useState} from 'react';
import { useCookies } from 'react-cookie';
import {logout} from './firebase.js';
import {gameList} from './games/constants.js';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from "@mui/material/CardContent";
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Avatar from "@mui/material/Avatar";
import IconButton from '@mui/material/IconButton';

import MenuIcon from '@mui/icons-material/Menu';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import QrCodeIcon from '@mui/icons-material/QrCode';

export function ProfileCard(props) {
  const data = props.data;
  const setCookie = useCookies(['pid', 'uid'])[1];
  const avatarSx = {
    marginLeft: 2,
    marginTop: "auto",
    marginBottom: "auto",
    color: "white",
    border: '3px solid white',
    bgcolor: "secondary.main",
    '&:hover': {
      borderColor: 'secondary.dark',
      borderWidth: '3px'
    },
  };

  return (
    <Card sx={{
      display: "flex",
      minWidth: 100,
      borderRadius: 5,
      margin: 2,
      '&:hover': {
        transition: '0.2s',
        transform: 'scale(1.03)',
      }
    }}>
      {props.imgSrc ?
        <Avatar alt="profile" sx={avatarSx} src={props.imgSrc}
          onClick={() => {
            setCookie('pid', props.id);
            setCookie('name', data.name);
            setCookie('dob', data.dob);
            setCookie('dp1', props.imgSrc.substring(0, 50000));
            setCookie('dp2', props.imgSrc.substring(50000, -1));
            window.location = "/menu";
          }}
        /> :
        <Avatar alt="profile" sx={avatarSx} onClick={() => {
          setCookie('pid', props.id);
          setCookie('name', data.name);
          setCookie('dob', data.dob);
          window.location = "/dashboard";
        }}>
          {data.name.charAt(0)}
        </Avatar>
      }
      <CardContent>
        <Typography>{data.name}</Typography>
        <Typography>{data.dob}</Typography>
      </CardContent>
      <Box display="flex" flexDirection="row" alignItems="center">
        <IconButton sx={{color: 'secondary.main'}} onClick={() => {
          window.location = "/qrcode"
        }}>
          <QrCodeIcon />
        </IconButton>
        <IconButton sx={{color: 'secondary.main'}} onClick={() => {
          window.location = "/edit-profile/?pid=" + props.id;
        }}>
          <EditIcon />
        </IconButton>
        {props.showDelete ?
          <IconButton sx={{color: 'secondary.main'}} onClick={async () => {
            alert("Feature not implemented yet");
          }}>
            <DeleteIcon />
          </IconButton> :
          <></>
        }
      </Box>
    </Card>
  );
}

export function HeaderBar(props) {
  const [state, setState] = useState(false);
  const cookies = useCookies(['pid', 'dob', 'name'])[0];

  return (
    <>
      <Drawer
        anchor={'left'}
        onClose={() => {setState(false)}}
        open={state}
      >
        <Box
          sx={{ width: 350 }}
          role="presentation"
          onClick={() => {setState(false)}}
          onKeyDown={() => {setState(false)}}
        >
          <ProfileCard id={cookies.pid} data={{dob: cookies.dob, name: cookies.name}} />
          <br />
          <Divider />

          <List>
            {gameList.map((game) => (
              <ListItemButton key={game} onClick={() => {
                window.location = '/' + game.replaceAll(' ', '-');
              }}>
                <ListItemText primary={game} />
              </ListItemButton>
            ))}
          </List>
          <br />
          <Divider />

          <List>
            <ListItemButton key={"Home"} onClick={() => {
              window.location = '/dashboard';
            }}>
              <ListItemText primary={"Home"} />
            </ListItemButton>
            <ListItemButton key={"Switch Profile"} onClick={() => {
              window.location = '/manage-profiles';
            }}>
              <ListItemText primary={"Switch Profile"} />
            </ListItemButton>
            <ListItemButton key={"Logout"} onClick={logout}>
              <ListItemText primary={"Logout"} />
            </ListItemButton>
          </List>
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

export function MenuCard(props) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {props.title}
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton size="small" onClick={() => {
          window.location = props.link;
        }}>
          <ArrowForwardRoundedIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
