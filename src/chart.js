import {HeaderBar} from './components.js';
import {useState, useEffect} from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    }
  },
};

function toCamel(string) {
  return string.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
}

const getNewData = async (cookies, type) => {
  const querySnapshot = await getDocs(collection(db, `${cookies.uid}/${cookies.pid}/${toCamel(type)}`));
  let tempLabels = [];
  let tempData = [];
  querySnapshot.forEach((doc) => {
    let temp = doc.data();
    tempLabels.push(temp.date);
    tempData.push(temp.score);
  });
  return [tempLabels, tempData];
};

export default function Chart() {
  const [type, setType] = useState("color-picking");
  const [labels, setLabels] = useState([]);
  const [data, setData] = useState([]);
  const cookies = useCookies(['uid', 'pid'])[0];
  const handleChange = async (event, newType) => {
    if (newType !== null && newType !== type) {
      setType(newType);
      const newValues = await getNewData(cookies, type);
      if (newValues[0].length === 0) {
        alert("No data found!");
      }
      setLabels(newValues[0]);
      setData(newValues[1]);
    }
  };

  useEffect(() => {getNewData(cookies, type);});

  return (
    <>
      <HeaderBar title="Previous Scores" />
      <ToggleButtonGroup value={type} exclusive onChange={handleChange}>
        {gameList.map((game, idx) => (
          <ToggleButton key={idx} value={game.replaceAll(' ', '-').toLowerCase()}>{game}</ToggleButton>
        ))}
      </ToggleButtonGroup>
      {labels.length === 0 ?
        <Typography>Fething data...</Typography> :
        <Line options={options} data={{labels, datasets:[{
          label: type,
          data: data,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }]}} />
      }
    </>
  );
}
