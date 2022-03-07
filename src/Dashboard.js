import React from "react";
import {gameList} from './games/constants.js';
import {HeaderBar, MenuCard} from "./components.js";

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
