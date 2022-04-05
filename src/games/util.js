import {videoWidth, videoHeight} from './constants.js';
import {db} from '../firebase.js';
import {addDoc, collection} from 'firebase/firestore';
import {useCookies} from 'react-cookie';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {useState, useEffect, useRef} from 'react';

const CAPTURE_OPTIONS = {audio: false, video: true};

function useUserMedia(requestedMedia) {
  const [mediaStream, setMediaStream] = useState(null);

  useEffect(() => {
    async function enableStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(requestedMedia);
        console.log(['enableStream: ', stream]);
        setMediaStream(stream);
      } catch(err) {
        console.log(err);
      }
    }
    function cleanup() {
      mediaStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    if (!mediaStream) {
      enableStream();
    } else {
      return cleanup;
    }
  }, [mediaStream, requestedMedia]);

  return mediaStream;
}

export function Webcam() {
  const videoRef = useRef(null);
  const mediaStream = useUserMedia(CAPTURE_OPTIONS);
  console.log(['Webcam()', mediaStream]);

  if (mediaStream && videoRef.current && !videoRef.current.srcObject) {
    videoRef.current.srcObject = mediaStream;
    videoRef.current.play();
  }

  function handleCanPlay() {
    videoRef.current.play();
  }

  return (
    <video id='webcam' style={{display: 'none'}} ref={videoRef} onCanPlay={handleCanPlay} autoPlay playsInline muted />
  );
}

export function getHandAverage(pointLists, handsList) {
  let out = {};
  for (var i=0; i<pointLists.length; i++) {
    let x = pointLists[i][0].x + pointLists[i][12].x;
    let y = pointLists[i][0].y + pointLists[i][12].y;
    x /= 2;
    y /= 2
    out[handsList[i].index] = {x:x, y:y};
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

export function EndScreen(props) {
  const cookies = useCookies(['uid', 'pid'])[0];
  return (
    <>
      <Box sx={{margin: 'auto'}}>
        <h1><big>Final Score: {props.score}/{props.total}</big></h1>
        <Button variant="contained" onClick={async () => {
          var now = new Date();
          const date = now.getDate()+'-'+(now.getMonth() + 1)+'-'+now.getFullYear();
          await addDoc(
            collection(db, `${cookies.uid}/${cookies.pid}/${props.type}`),
            {score: props.score, date: date}
          );
          window.location = "/dashboard";
        }}>
          Done
        </Button>
      </Box>
    </>
  );
}
