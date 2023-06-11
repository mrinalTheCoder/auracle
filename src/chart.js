import {HeaderBar} from './components.js';
import {useState, useEffect} from 'react';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import {gameList} from './games/constants.js';
import { collection, getDocs } from "firebase/firestore";
import {db} from './firebase.js';
import {useCookies} from 'react-cookie';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    }
  },
  scales: {
    y: {
      min: 0,
      max: 10,
      stepSize: 1
    }
  },
  legend: {
    position: 'top'
  }
};

function toCamel(string) {
  return string.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

export default function Chart() {
  const [type, setType] = useState("color-picking");
  const [data, setData] = useState([]);
  const cookies = useCookies(['uid', 'pid'])[0];

  useEffect(() => {
    async function fetchData() {
      const querySnapshot = await getDocs(
        collection(db, `${cookies.uid}/${cookies.pid}/${toCamel(type)}`)
      );

      let tempData = [];
      querySnapshot.forEach((doc) => {
        let temp = doc.data();
        let score;
        if (typeof temp.score === 'string') {
          let scores = temp.score.split(',');
          score = scores.reduce((out, x) => out+parseInt(x), 0);
        } else {
          score = temp.score;
        }
        tempData.push({score: score, date: temp.date});
      });
      if (querySnapshot.size === 0) {
        alert('No data for this game available!');
      }

      tempData.sort((x, y) => {return x.score - y.score});
      setData(tempData);
    }
    fetchData();
  }, [type, cookies]);

  return (
    <>
      <HeaderBar title="Previous Scores" />
      <br />
      <Typography>Select Game:</Typography>
      <Select
        value={type}
        onChange={(e) => {
          setType(e.target.value);
        }}
      >
        {gameList.map((game, idx) => (
          <MenuItem key={idx} value={game.replaceAll(' ', '-').toLowerCase()}>{game}</MenuItem>
        ))}
      </Select>
      {data.length === 0 ?
        <Typography>Fetching data...</Typography> :
        <Line options={options} data={{labels:data.map(x => x.date), datasets: [{
          label: 'Game Scores',
          data: data.map(x => x.score),
          pointRadius: 7,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }]}} />
      }
    </>
  );
}
