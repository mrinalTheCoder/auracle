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
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Avatar from "@mui/material/Avatar";
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import MenuIcon from '@mui/icons-material/Menu';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import QrCodeIcon from '@mui/icons-material/QrCode';

const drawerWidth = 350;

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
          alert("Feature not implemented");
        }}>
          <QrCodeIcon />
        </IconButton>
        <IconButton sx={{color: 'secondary.main'}} onClick={() => {
          alert("Feature not implemented");
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
  const temp = useCookies(['uid', 'pid', 'dob', 'name']);
  const cookies = temp[0];

  return (
    <>
      <Drawer
        anchor={'left'}
        onClose={() => {setState(false)}}
        open={state}
      >
        <Box
          sx={{ width: drawerWidth }}
          role="presentation"
          onClick={() => {setState(false)}}
          onKeyDown={() => {setState(false)}}
        >
          {cookies.uid === undefined ?
            <>
              <br />
              <Button
                variant="contained"
                onClick={() => {window.location = '/';}}
                style={{marginLeft: 5, minWidth: drawerWidth-10}}
              >
                Sign In
              </Button>
              <br />
            </> :
            <ProfileCard id={cookies.pid} data={{dob: cookies.dob, name: cookies.name}} />
          }
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
          <Divider />

          <List>
            <ListItemButton key={"Home"} onClick={() => {
              window.location = '/dashboard';
            }}>
              <ListItemText primary={"Home"} />
            </ListItemButton>
            <ListItemButton key={"Feedback"} onClick={() => {
              window.location = '/feedback';
            }}>
              <ListItemText primary={"Submit Feedback"} />
            </ListItemButton>
            <ListItemButton key={"View Scores"} onClick={() => {
              window.location = '/chart';
            }}>
              <ListItemText primary={"View Scores"} />
            </ListItemButton>
            <ListItemButton key={"Switch Profile"} onClick={() => {
              window.location = '/manage-profiles';
            }}>
              <ListItemText primary={"Switch Profile"} />
            </ListItemButton>
            <ListItemButton key={"Logout"} onClick={() => {
              logout();
            }}>
              <ListItemText primary={"Logout"} />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{height: 30}}>
          <Toolbar variant="dense" sx={{mt: -1}}>
            <IconButton
              size="small"
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
            <Typography variant="h6">{props.secondaryText}</Typography>
          </Toolbar>
        </AppBar>
      </Box>
    </>
  );
}

export function MenuCard(props) {
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
        <CardContent>
          <Typography variant="h5" component="div">
            {props.title}
          </Typography>
        </CardContent>
        <Box display="flex" flexDirection="row" alignItems="center">
          <IconButton sx={{color: 'secondary.main'}} onClick={() => {
            window.location = props.link;
          }}>
            <ArrowForwardRoundedIcon />
          </IconButton>
        </Box>
    </Card>
  );
}
