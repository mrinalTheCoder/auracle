import React from "react";
import {gameList} from './games/constants.js';
import {HeaderBar, MenuCard} from "./components.js";
import Divider from '@mui/material/Divider';

function Dashboard() {
  return (
    <>
      <HeaderBar title="Dashboard" />
      <ul style={{paddingLeft: 0}}>
        {gameList.map((game, idx) => (
          <MenuCard key={idx} title={game} link={`/${game.replaceAll(' ', '-')}`} />
        ))}
      </ul>
      <Divider />
      <MenuCard title={"Submit Feedback"} link={'/feedback'} />
    </>
  );
}

export default Dashboard;
