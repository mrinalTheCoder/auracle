import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {useCookies} from 'react-cookie';
import { auth,  logInWithEmailAndPassword, signInWithGoogle } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {Box} from '@mui/material';
import {Button} from '@mui/material';
import {TextField} from '@mui/material';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setCookie = useCookies(['uid'])[1];
  const temp = useAuthState(auth);
  const user = temp[0];
  const loading = temp[1];
  const navigate = useNavigate();

  const buttonSx = {
    padding: '10px',
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
      navigate("/manage-profiles");
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
          sx={{marginBottom: '10px'}}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail Address"
        />
        <TextField
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
        >
          Login
        </Button>
        <Button sx={buttonSx} variant="contained" onClick={signInWithGoogle}>
          Login with Google
        </Button>
        <Box>
          <Link to="/reset">Forgot Password</Link>
        </Box>
        <Box>
          Don't have an account? <Link to="/register">Register</Link> now.
        </Box>
        <Box>
          Got any feedback? Click <Link to="/feedback">here</Link>
        </Box>
      </Box>
    </Box>
  );
}
export default Login;
