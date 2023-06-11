import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {useCookies} from 'react-cookie';
import { auth,  logInWithEmailAndPassword, signInWithGoogle } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {Box} from '@mui/material';
import {Button} from '@mui/material';
import {TextField} from '@mui/material';
import {Divider} from '@mui/material';
import {Chip} from '@mui/material';
import { Typography } from '@mui/material';
import GoogleButton from 'react-google-button';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setCookie = useCookies(['uid'])[1];
  const temp = useAuthState(auth);
  const user = temp[0];
  const loading = temp[1];
  const navigate = useNavigate();

  const buttonSx = {
    marginBottom: '10px',
    border: 'solid',
    borderColor:'primary.light'
  };

  useEffect(() => {
    if (loading) {
      // maybe trigger a loading screen
      return;
    }
    if (user) {
      setCookie('uid', user.uid);
      navigate("/manage-profiles", { replace: true });
    }
  }, [user, setCookie, loading, navigate]);

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        bgcolor: '#dcdcdc',
        padding: '30px',
      }}>
        <TextField
          size="small"
          sx={{marginBottom: '10px'}}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail Address"
        />
        <TextField
          size="small"
          type="password"
          sx={{marginBottom: '10px'}}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <Button
          sx={buttonSx}
          variant="contained"
          onClick={() => logInWithEmailAndPassword(email, password)}
        >Login
        </Button>

        <Divider sx={{marginBottom: '10px'}}>
          <Chip label="OR" />
        </Divider>
        <GoogleButton
          type="light"
          label="Sign in with Google"
          onClick={signInWithGoogle}/>
        <br/>
        <Typography variant="body1">
          <Box><Link to="/reset">Forgot Password</Link></Box>
          <Box>Don't have an account? <Link to="/register">Register</Link> now.</Box>
          <Box>Got any feedback? Click <Link to="/feedback">here</Link></Box>
        </Typography>
      </Box>
    </Box>
  );
}
export default Login;
