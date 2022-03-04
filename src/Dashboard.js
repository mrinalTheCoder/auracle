import React from "react";
import { logout } from "./firebase";
import {HeaderBar, MenuCard} from "./components.js";
import "./css/Dashboard.css";

const gameList = ['Color Picking', 'Color Matching', 'Shape Picking', 'Shape Matching'];

function Dashboard() {
  return (
    <>
      <HeaderBar title="Dashboard" />
      <ul>
        {gameList.map((game) => (
          <MenuCard title={game} link={`/${game.replaceAll(' ', '-')}`}/>
        ))}
      </ul>
      <div className="dashboard__container">
        <button className="dashboard__btn" onClick={logout}>Logout</button>
      </div>
    </>
  );
}

export default Dashboard;
