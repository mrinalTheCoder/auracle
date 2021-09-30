import './App.css';
import {Hands} from "@mediapipe/hands";
import * as hands from "@mediapipe/hands";
import Webcam from "react-webcam";
import * as cam from "@mediapipe/camera_utils";
import {useRef, useEffect} from 'react';

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const displayStyle = {
    position: 'absolute',
    marginRight: 'auto',
    marginLeft: 'auto',
    left: 0, right: 0,
    textAlign: 'center',
    zIndex:9,
    width: 640, height: 480
  };

  function onResults(results) {
    canvasRef.current.width = webcamRef.current.video.videoWidth;
    canvasRef.current.height = webcamRef.current.video.videoHeight;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d');

    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        window.drawConnectors(ctx, landmarks, hands.HAND_CONNECTIONS,
                       {color: '#00FF00', lineWidth: 5});
        window.drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 2});
      }
    }
    ctx.restore();
  }

  useEffect(() => {
    const hands = new Hands({
      locateFile:(file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    })
    hands.setOptions({
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    hands.onResults(onResults);

    const camera = new cam.Camera(webcamRef.current.video, {
      onFrame:async () => {
        await hands.send({image: webcamRef.current.video});
      },
      width: 640,
      height: 480
    });
    camera.start();
  });

  return (
    <div className="App">
      <Webcam ref={webcamRef} style={displayStyle} />
      <canvas ref={canvasRef} style={displayStyle} ></canvas>
    </div>
  );
}

export default App;
