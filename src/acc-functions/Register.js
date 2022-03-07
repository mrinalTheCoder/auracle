import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import {auth, registerWithEmailAndPassword, signInWithGoogle} from "../firebase";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const temp = useAuthState(auth);
  const user = temp[0];
  const loading = temp[1];
  const navigate = useNavigate();
  const register = () => {
    registerWithEmailAndPassword(name, email, password);
  };
  useEffect(() => {
    if (loading) return;
    if (user) navigate("/manage-profiles", { replace: true });
  }, [user, loading, navigate]);
  return (
    <div className="auth">
      <div className="auth__container">
        <input
          type="text"
          className="auth__textBox"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
        />
        <input
          type="text"
          className="auth__textBox"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail Address"
        />
        <input
          type="password"
          className="auth__textBox"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button className="auth__btn" onClick={register}>
          Register
        </button>
        <button
          className="auth__btn auth__google"
          onClick={signInWithGoogle}
        >
          Register with Google
        </button>
        <div>
          Already have an account? <Link to="/">Login</Link> now.
        </div>
      </div>
    </div>
  );
}
export default Register;
