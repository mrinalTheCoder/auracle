import Webcam from 'react-webcam';
import {getDistance, shuffle, SelectMode, EndScreen} from './util.js';
import {PickingTarget, Midpoint} from './base-classes.js';
import {TARGETSIZE, BINSOUND, WRONGBINSOUND, RESETTING_FRAMES, voiceParams} from './constants.js';
import confetti from 'canvas-confetti';
import LoadingScreen from 'react-loading-screen';
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
cueVoice.rate = voiceParams.rate;

function populateVoice() {
  let voices = window.speechSynthesis.getVoices();
  cueVoice.voice = voices.filter((voice) => { return voice.name === voiceParams.lang; })[0];
}

populateVoice();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoice;
}

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

    this.state = {score: [], total: 0, target: null, started: false};
    this.handPoint = {};
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

    if (this.state.target === null) {
      const randomColors = shuffle(optionColors).slice(-3);
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Circle(optionPositions[i].x, optionPositions[i].y, randomColors[i]));
      }
      if (this.state.total === 0) {
        cueVoice.text = 'Move your hand to the matching colour';
        window.speechSynthesis.speak(cueVoice);
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
      this.setState({target: new Circle(targetPosition.x, targetPosition.y, randomColors[toss])});
    }

    this.state.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        if (getDistance(pos, this.options[i].pos) <= 60) {
		      this.times.push(new Date());
          if (this.options[i].matches(this.state.target, 'color')) {
            this.setState({target: null});
            this.setState({score: [...this.state.score, 1]});
            var binAudio = new Audio(BINSOUND);
            binAudio.play();
            confetti({
              particleCount: 150,
              spread: 70,
              ticks: 100,
              origin: { y: 0.7 }
            });
          } else {
            this.setState({target: null});
			      this.setState({score: [...this.state.score, 0]});
            var wrongBinAudio = new Audio(WRONGBINSOUND);
            wrongBinAudio.play();
          }
          this.setState({total: this.state.total + 1});
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
