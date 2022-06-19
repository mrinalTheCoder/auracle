import {videoWidth, videoHeight, FINALFANFARE} from './constants.js';
import {db} from '../firebase.js';
import {addDoc, collection} from 'firebase/firestore';
import {useCookies} from 'react-cookie';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

export function getHandAverage(pointLists, handsList, mode) {
  let out = {};
  for (var i=0; i<pointLists.length; i++) {
    if (mode === 'avg') {
      let x = pointLists[i][0].x + pointLists[i][12].x;
      let y = pointLists[i][0].y + pointLists[i][12].y;
      x /= 2;
      y /= 2;
      out[handsList[i].index] = {x:x, y:y};
    } else {
      out[handsList[i].index] = {x:pointLists[i][8].x, y:pointLists[i][8].y};
    }
  }
  return out;
}

export function getDistance(p1, p2) {
  return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
}

export function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function scalePoints(points) {
  for (const hand of Object.keys(points)) {
    points[hand].x *= videoWidth;
    points[hand].y *= videoHeight;
  }
  return points;
}

export function SelectMode(props) {
  return (
    <Select value={window.location.search.substring(6)} onChange={(e) => {
      window.location = `/${props.game}?mode=${e.target.value}`;
    }}>
      <MenuItem value="avg">Hand average</MenuItem>
      <MenuItem value="point">Pointer Finger</MenuItem>
    </Select>
  );
}

export function EndScreen(props) {
  const cookies = useCookies(['uid', 'pid'])[0];
  var fanfareAudio = new Audio(FINALFANFARE);
  fanfareAudio.play();

  return (
    <>
      <Box sx={{margin: 'auto'}}>
        <h1><big>Final Score: {props.score}/{props.total}</big></h1>
        <Button variant="contained" onClick={async () => {
          var now = new Date();
          const date = now.getDate()+'-'+(now.getMonth() + 1)+'-'+now.getFullYear();
		  var activityTimes = [];
		  for (let i=1; i<props.times.length; i++) {
            activityTimes.push(props.times[i]-props.times[i-1]);
		  }
		  await addDoc(
			collection(db, `${cookies.uid}/${cookies.pid}/${props.type}`), {
			  score: props.score,
			  date: date,
			  mode: window.location.search.substring(6),
			  times: activityTimes.join(',')
			});
		  window.location = "/dashboard";
        }}>
          Done
        </Button>
      </Box>
    </>
  );
}
