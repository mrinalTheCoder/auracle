import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { auth, db, logout } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import {HeaderBar} from "./components.js";
import "./css/Dashboard.css";

function Dashboard() {
  return (
    <>
      <HeaderBar title="Dashboard" />
      <div className="dashboard__container">
        <button className="dashboard__btn" onClick={logout}>Logout</button>
      </div>
    </>
  );
}

export default Dashboard;
