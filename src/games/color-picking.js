import Webcam from 'react-webcam';
import {getDistance, shuffle, SelectMode, EndScreen} from './util.js';
import {PickingTarget, Midpoint} from './base-classes.js';
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
const optionColors = ['yellow', 'blue', 'black', 'red', 'green', 'darkorange', 'saddlebrown', 'purple'];
const targetPosition = {x: videoWidth - TARGETSIZE, y: videoHeight/2};


let cueVoice = new SpeechSynthesisUtterance();
const voices = window.speechSynthesis.getVoices();
cueVoice.voice = voices[1];
cueVoice.rate = 0.7;

class Circle extends PickingTarget {
  constructor(x, y, color, size=TARGETSIZE) {
    super(x, y, size);
    this.midpoint = new Midpoint();
    this.color = color;
  }

  drawPosition(ctx) {
    super.drawPosition();
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
    ctx.closePath();
    ctx.fill();
    // this.midpoint.drawPosition(ctx, this.pos);
  }
}

class ColorPicking extends React.Component {
  constructor(props) {
    super(props);
    if (window.location.search === '') {
      window.location = '/color-picking?mode=avg';
    }

    this.state = {score: [], total: 0};
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

    this.times = [new Date()];
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

	var introAudio = new Audio('intros/ColorIntro.mp3');
	introAudio.play();

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
      const randomColors = shuffle(optionColors).slice(-3);
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Circle(optionPositions[i].x, optionPositions[i].y, randomColors[i]));
      }
      let toss = Math.floor(Math.random()*3);
	  if (randomColors[toss] === 'saddlebrown') {
	    cueVoice.text = 'brown';
	  } else if (randomColors[toss] === 'darkorange') {
	    cueVoice.text = 'orange';
	  } else {
		cueVoice.text = randomColors[toss];
	  }
	  window.speechSynthesis.speak(cueVoice);
      this.target = new Circle(targetPosition.x, targetPosition.y, randomColors[toss]);
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
		  this.times.push(new Date());
          if (this.options[i].matches(this.target, 'color')) {
            this.setState({score: [...this.state.score, 1]});
            var binAudio = new Audio(BINSOUND);
            binAudio.play();
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.7 }
            });
          } else {
			this.setState({score: [...this.state.score, 0]});
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
          title="Color Picking: Match the colors by touching"
          secondaryText={`Score: ${this.state.score.reduce((sum, a) => sum+a, 0)} out of ${this.state.total}`}
        />
        <Box>
          {(this.state.total < 10) ? (
            <>
              <Webcam id='webcam' style={{display:'none'}} />
              <canvas id='canvas' style={this.displayStyle} ></canvas>
              <SelectMode game='color-picking' />
            </>
          ) : (
            <EndScreen
              type='colorPicking'
              score={this.state.score}
              total={this.state.total}
              times={this.times}
            />
          )}
        </Box>
      </>
    );
  }
}

export default ColorPicking;
