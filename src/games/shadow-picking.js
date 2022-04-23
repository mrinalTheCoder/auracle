import Webcam from 'react-webcam';
import {getDistance, shuffle, SelectMode, EndScreen} from './util.js';
import {PickingTarget} from './base-classes.js';
import {TARGETSIZE, BINSOUND, WRONGBINSOUND} from './constants.js';
import confetti from 'canvas-confetti';
import {videoWidth, videoHeight} from './constants.js';
import AIProvider from './ai-provider.js';
import {HeaderBar} from '../components.js';
import Box from '@mui/material/Box';
import React from 'react';

const optionPositions = [
  {x: TARGETSIZE, y: TARGETSIZE},
  {x: TARGETSIZE, y: videoHeight/2},
  {x: TARGETSIZE, y: videoHeight - TARGETSIZE}
];
const optionShadows = ['elephant', 'leopard', 'tiger', 'lion', 'deer', 'giraffe'];
const targetPosition = {x: videoWidth - TARGETSIZE, y: videoHeight/2};

class ShadowImg extends PickingTarget {
  constructor(x, y, path, real=false, size=TARGETSIZE) {
    super(x, y, size);
    this.path = path;
    this.real = real;
    this.img = new Image();
    this.img.src = this.real ? './shadow-imgs/'+this.path+'-real.png' : './shadow-imgs/'+this.path+'.png';
  }

  drawPosition(ctx) {
    super.drawPosition();
    this.img.onload = () => {
      ctx.drawImage(this.img, this.x, this.y);
    };
  }
}

class ShadowPicking extends React.Component {
  constructor(props) {
    super(props);
    if (window.location.search === '') {
      window.location = '/shadow-picking?mode=avg';
    }

    this.state = {score: 0, total: 0};
    this.handPoint = {};
    this.target = null;
    this.options = [];
    this.frameCount = 0;
    this.isResetting = false;
    this.displayStyle = {
      position: 'absolute',
      marginRight: 'auto',
      marginLeft: 'auto',
      left: 0, right: 0,
      textAlign: 'center',
      width: videoWidth, height: videoHeight
    };

    this.start = new Date();
    this.onHandResults = this.onHandResults.bind(this);
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

    this.aiProvider = new AIProvider(
      this.onHandResults,
      this.webcamRef,
      this.ctx,
      window.location.search.substring(6)
    );
  }

  onHandResults(averagePoints) {
    if (this.frameCount === 40) {
      this.frameCount = 0;
      this.isResetting = false;
    }
    if (this.isResetting) {
      this.frameCount += 1;
      return;
    }

    if (this.target === null) {
      const randomShadows = shuffle(optionShadows).slice(-3);
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new ShadowImg(optionPositions[i].x, optionPositions[i].y, randomShadows[i]));
      }
      let toss = Math.floor(Math.random()*3);
      this.target = new ShadowImg(targetPosition.x, targetPosition.y, randomShadows[toss], true);
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
          if (this.options[i].path === this.target.path) {
            this.setState({score: this.state.score + 1});
            var binAudio = new Audio(BINSOUND);
            binAudio.play();
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.7 }
            });
          } else {
            var wrongBinAudio = new Audio(WRONGBINSOUND);
            wrongBinAudio.play();
          }
          this.setState({total: this.state.total + 1});
          this.target = null;
          this.options = [];
          this.isResetting = true;
          return;
        }
      }
    }
  }

  scaleAveragePoints(averagePoints) {
    for (const hand of Object.keys(averagePoints)) {
      averagePoints[hand].x *= videoWidth;
      averagePoints[hand].y *= videoHeight;
    }
    return averagePoints;
  }

  render() {
    return (
      <>
        <HeaderBar
          title="Shadow Picking: Match the animal to its shadow by touching"
          secondaryText={`Score: ${this.state.score} out of ${this.state.total}`}
        />
        <Box>
          {(this.state.total < 10) ? (
            <>
              <Webcam id='webcam' style={{display:'none'}} />
              <canvas id='canvas' style={this.displayStyle} ></canvas>
              <SelectMode game='shadow-picking' />
            </>
          ) : (
            <EndScreen
              type='shadowPicking'
              score={this.state.score}
              total={this.state.total}
              start={this.start}
            />
          )}
        </Box>
      </>
    );
  }
}

export default ShadowPicking;