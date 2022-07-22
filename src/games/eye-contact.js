import {FaceMesh} from "@mediapipe/face_mesh";
import {FACEMESH_TESSELATION, FACEMESH_LIPS, FACEMESH_FACE_OVAL} from "@mediapipe/face_mesh";
import {FACEMESH_RIGHT_EYE, FACEMESH_LEFT_EYE} from "@mediapipe/face_mesh";
import {FACEMESH_RIGHT_EYEBROW, FACEMESH_LEFT_EYEBROW} from "@mediapipe/face_mesh";
import {FACEMESH_RIGHT_IRIS, FACEMESH_LEFT_IRIS} from "@mediapipe/face_mesh";
import {getDistance, scalePoints, getEyeAverage} from './util.js';

import {HeaderBar} from "../components.js";
import Webcam from 'react-webcam';
import Box from '@mui/material/Box';
import React from 'react';
import * as cam from '@mediapipe/camera_utils';
import {videoWidth, videoHeight} from './constants.js';

var context = new AudioContext();
var tone = context.createOscillator();
tone.type = "sine";
tone.frequency.setValueAtTime(0, context.currentTime);
tone.connect(context.destination);
tone.start();

class EyeContact extends React.Component {
  constructor(props) {
    super(props);
    this.displayStyle = {
      position: 'absolute',
      marginRight: 'auto',
      marginLeft: 'auto',
      left: 0, right: 0,
      textAlign: 'center',
      width: videoWidth, height: videoHeight
    };

    this.onFaceResults = this.onFaceResults.bind(this);
  }

  componentDidMount() {
    this.webcamRef = document.getElementById('webcam');
    this.canvasRef = document.getElementById('canvas');

    this.canvasRef.width = videoWidth;
    this.canvasRef.height = videoHeight;
    this.canvasElement = this.canvasRef;
    this.ctx = this.canvasElement.getContext('2d');
    this.ctx.translate(videoWidth, 0);
    this.ctx.scale(-1, 1);

    const faceMesh = new FaceMesh({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }});
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    faceMesh.onResults(this.onFaceResults);

    const camera = new cam.Camera(this.webcamRef, {
      onFrame: async () => {
        await faceMesh.send({image: this.webcamRef});
      },
      width: videoWidth,
      height: videoHeight
    });
    camera.start();
  }

  onFaceResults(results) {
    this.ctx.save();
    this.ctx.clearRect(0, 0, videoWidth, videoHeight);
    this.ctx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        window.drawConnectors(this.ctx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_RIGHT_IRIS, {color: '#FF3030'});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_LEFT_IRIS, {color: '#30FF30'});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
        window.drawConnectors(this.ctx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});

        // index 19 is nose, 93 is right, 323 is left
        let [nose, leftCheek, rightCheek, forehead, chin] = scalePoints([
          results.multiFaceLandmarks[0][19],
          results.multiFaceLandmarks[0][323],
          results.multiFaceLandmarks[0][93],
          results.multiFaceLandmarks[0][151],
          results.multiFaceLandmarks[0][152]
        ]);

        let leftEye = getEyeAverage([474, 475, 476, 477].map((x) => results.multiFaceLandmarks[0][x]));
        leftEye = scalePoints([leftEye])[0];
        let leftLeftEye = scalePoints([results.multiFaceLandmarks[0][359]])[0];
        let rightLeftEye = scalePoints([results.multiFaceLandmarks[0][362]])[0];

        // this.ctx.beginPath();
        // this.ctx.arc(nose.x, nose.y, 10, 0, 2*Math.PI);
        // this.ctx.fillStyle = 'cyan';
        // this.ctx.fill();
        //
        // this.ctx.beginPath();
        // this.ctx.arc(forehead.x, forehead.y, 10, 0, 2*Math.PI);
        // this.ctx.fillStyle = 'cyan';
        // this.ctx.fill();
        //
        // this.ctx.beginPath();
        // this.ctx.arc(chin.x, chin.y, 10, 0, 2*Math.PI);
        // this.ctx.fillStyle = 'cyan';
        // this.ctx.fill();

        let lateralDiff = getDistance(nose, leftCheek) - getDistance(nose, rightCheek);
        let verticalDiff = getDistance(nose, forehead) - getDistance(nose, chin);
        let eyeDiff = getDistance(leftEye, leftLeftEye) - getDistance(leftEye, rightLeftEye);
        if (
          Math.abs(lateralDiff) <= 40 &&
          Math.abs(eyeDiff) <= 10 &&
          Math.abs(verticalDiff) <= 30
        ) {
          tone.frequency.setValueAtTime(0, context.currentTime);
        } else {
          tone.frequency.setValueAtTime(440, context.currentTime);
        }
      }
    }
    this.ctx.restore();
  }

  render() {
    return (
      <>
        <HeaderBar
          title="Color Picking: Match the colors by touching"
        />
        <Box>
          <Webcam id='webcam' style={{display:'none'}} />
          <canvas id='canvas' style={this.displayStyle} ></canvas>
        </Box>
      </>
    );
  }
}

export default EyeContact;
