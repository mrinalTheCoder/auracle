import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import {useCookies} from 'react-cookie';
import {auth, registerWithEmailAndPassword, signInWithGoogle} from "../firebase";
import {Box} from '@mui/material';
import {Button} from '@mui/material';
import {TextField} from '@mui/material';
import {Divider} from '@mui/material';
import {Chip} from '@mui/material';
import { Typography } from '@mui/material';

import GoogleButton from 'react-google-button';

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setCookie = useCookies(['uid'])[1];
  const temp = useAuthState(auth);
  const user = temp[0];
  const loading = temp[1];
  const navigate = useNavigate();
  const register = () => {
    registerWithEmailAndPassword(email, password);
  };

  const buttonSx = {
    marginBottom: '10px',
    border: 'solid',
    borderColor:'primary.light'
  };

  useEffect(() => {
    if (loading) return;
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
        <Button sx={buttonSx} variant="contained" onClick={register}>
          Register
        </Button>
        <Divider sx={{marginBottom: '10px'}}>
          <Chip label="OR" />
        </Divider>
        <GoogleButton
          type="light"
          label="Sign up with Google"
          onClick={signInWithGoogle}
        />
        <br/>
        <Typography variant="body1">
          <Box>Already have an account? <Link to="/">Login</Link> now.</Box>
        </Typography>
      </Box>
    </Box>
  );
}
export default Register;
