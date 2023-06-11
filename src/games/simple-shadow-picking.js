import Webcam from 'react-webcam';
import {getDistance, shuffle, SelectMode, EndScreen} from './util.js';
import {PickingTarget, Midpoint} from './base-classes.js';
import {TARGETSIZE, BINSOUND, WRONGBINSOUND, RESETTING_FRAMES, voiceParams} from './constants.js';
import confetti from 'canvas-confetti';
import LoadingScreen from 'react-loading-screen';
import {videoWidth, videoHeight} from './constants.js';
import {HeaderBar} from '../components.js';
import AIProvider from './ai-provider.js';
import Box from '@mui/material/Box';
import React from 'react';

const optionPositions = [
  {x: TARGETSIZE, y: TARGETSIZE},
  {x: TARGETSIZE, y: videoHeight/2},
  {x: TARGETSIZE, y: videoHeight - TARGETSIZE}
];
const optionShapes = ['Circle', 'Triangle', 'Square', 'Star', 'Diamond'];
const targetPosition = {x: videoWidth - TARGETSIZE, y: videoHeight/2};

let cueVoice = new SpeechSynthesisUtterance();
cueVoice.rate = voiceParams.rate;

function populateVoice() {
  let voices = window.speechSynthesis.getVoices();
  cueVoice.voice = voices.filter((voice) => { return voice.name === voiceParams.lang; })[0];
}

populateVoice();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoice;
}

class Shape extends PickingTarget {
  constructor(x, y, shape, color, isTarget) {
    super(x, y, TARGETSIZE);
    this.shape = shape;
    this.midpoint = new Midpoint();
    this.color = color;
    this.isTarget = isTarget;
  }

  drawPosition(ctx) {
    super.drawPosition();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = 5;
    if (this.shape === 'Circle') {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
      ctx.closePath();
      if (this.isTarget) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else if (this.shape === 'Square') {
      if (this.isTarget) {
        ctx.fillRect(this.pos.x- this.size/2, this.pos.y -this.size/2, this.size, this.size);
      } else {
        ctx.strokeRect(this.pos.x- this.size/2, this.pos.y -this.size/2, this.size, this.size);
      }
    } else if (this.shape === 'Triangle') {
      ctx.beginPath();
      ctx.moveTo(this.pos.x  - this.size/2, this.pos.y+this.size/(2*Math.sqrt(3)));
      ctx.lineTo(this.pos.x + this.size/2, this.pos.y+ this.size/(2*Math.sqrt(3)));
      ctx.lineTo(this.pos.x, this.pos.y - this.size/(Math.sqrt(3)));
      ctx.closePath();
      if (this.isTarget) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else if (this.shape === 'Star') {
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / 5;
      let x = this.pos.x;
      let y = this.pos.y;
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y - this.size/2)
      for (let i=0; i<5; i++) {
        x = this.pos.x + Math.cos(rot) * this.size/2;
        y = this.pos.y + Math.sin(rot) * this.size/2;
        ctx.lineTo(x, y);
        rot += step;
        x = this.pos.x + Math.cos(rot) * this.size/4;
        y = this.pos.y + Math.sin(rot) * this.size/4;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(this.pos.x, this.pos.y - this.size/2)
      ctx.closePath();
      if (this.isTarget) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else if (this.shape === 'Diamond') {
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.pos.x+this.size/2, this.pos.y+this.size/2);
      ctx.lineTo(this.pos.x, this.pos.y+this.size);
      ctx.lineTo(this.pos.x-this.size/2, this.pos.y+this.size/2);
      ctx.closePath();
      if (this.isTarget) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }
    this.midpoint.drawPosition(ctx, this.pos);
  }
}

class SimpleShadowPicking extends React.Component {
  constructor(props) {
    super(props);
    if (window.location.search === '') {
      window.location = '/simple-shadow-picking?mode=avg';
    }

    this.state = {score: [], total: 0, started: false};
    this.handPoint = {};
    this.target = null;
    this.options = [];
    this.frameCount = 0;
    this.isResetting = false;
    this.times = [new Date()];
    this.displayStyle = {
      position: 'absolute',
      marginRight: 'auto',
      marginLeft: 'auto',
      left: 0, right: 0,
      textAlign: 'center',
      width: videoWidth, height: videoHeight
    };

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
    if (!this.state.started) {
      this.setState({started: true});
    }
    if (this.frameCount === RESETTING_FRAMES) {
      this.frameCount = 0;
      this.isResetting = false;
    }
    if (this.isResetting) {
      this.frameCount += 1;
      return;
    }

    if (this.target === null) {
      const randomShapes = shuffle(optionShapes).slice(-3);
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Shape(optionPositions[i].x, optionPositions[i].y, randomShapes[i], 'black', false));
      }
      let toss = Math.floor(Math.random()*3);
      if (this.state.total === 0) {
        cueVoice.text = 'Move your hand to the matching shape outline';
        window.speechSynthesis.speak(cueVoice);
      }
	    cueVoice.text = randomShapes[toss];
	    window.speechSynthesis.speak(cueVoice);
      this.target = new Shape(targetPosition.x, targetPosition.y, randomShapes[toss], 'blue', true);
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
		      this.times.push(new Date());
          if (this.options[i].matches(this.target, 'shape')) {
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
          title="Simple Shadow Picking: Match the shape to its outline"
          secondaryText={`Score: ${this.state.score.reduce((sum, a) => sum+a, 0)} out of ${this.state.total}`}
        />
        <Box>
          {(this.state.total < 10) ? (
            <>
            <LoadingScreen
              loading={!this.state.started}
              bgColor='#f1f1f1'
              spinnerColor='#6effbe'
              textColor='#676767'
              text='Hang tight while our AI loads!'
            >
              <Webcam id='webcam' style={{display:'none'}} />
              <canvas id='canvas' style={this.displayStyle} ></canvas>
              <SelectMode game='color-picking' />
            </LoadingScreen>
            </>
          ) : (
            <EndScreen
              type='shapePicking'
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

export default SimpleShadowPicking;
