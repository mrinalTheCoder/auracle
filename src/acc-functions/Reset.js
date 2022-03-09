import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { auth, sendPasswordReset } from "../firebase";

const buttonSx = {
  padding: '10px',
  marginBottom: '10px',
  border: 'solid',
  borderColor:'primary.light'
};

function Reset() {
  const [email, setEmail] = useState("");
  const temp = useAuthState(auth);
  const user = temp[0];
  const loading = temp[1];
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (user) navigate("/dashboard");
  }, [user, loading, navigate]);

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
        <Button
          sx={buttonSx}
          variant="contained"
          onClick={() => sendPasswordReset(email)}
        >
          Send password reset email
        </Button>
        <Box>
          Don't have an account? <Link to="/register">Register</Link> now.
        </Box>
      </Box>
    </Box>
  );
}
export default Reset;
