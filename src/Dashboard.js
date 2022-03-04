import React from "react";
import {gameList} from './constants.js';
import {HeaderBar, MenuCard} from "./components.js";
import "./css/Dashboard.css";

function Dashboard() {
  return (
    <>
      <HeaderBar title="Dashboard" />
      <ul>
        {gameList.map((game, idx) => (
          <MenuCard key={idx} title={game} link={`/${game.replaceAll(' ', '-')}`} />
        ))}
      </ul>
    </>
  );
}

export default Dashboard;
