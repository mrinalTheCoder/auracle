import Webcam from 'react-webcam';
import {getDistance, shuffle, SelectMode, EndScreen} from './util.js';
import {PickingTarget} from './base-classes.js';
import {IMGSIZE, BINSOUND, WRONGBINSOUND, RESETTING_FRAMES, voiceParams} from './constants.js';
import confetti from 'canvas-confetti';
import LoadingScreen from 'react-loading-screen';
import {videoWidth, videoHeight} from './constants.js';
import AIProvider from './ai-provider.js';
import {HeaderBar} from '../components.js';
import Box from '@mui/material/Box';
import React from 'react';

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

const optionPositions = [
  {x: 0, y: 0},
  {x: 0, y: videoHeight/2 - IMGSIZE/2},
  {x: 0, y: videoHeight - IMGSIZE}
];
const optionImgs = ['dinosuar', 'dog', 'frog', 'ghost', 'turtle'];
const targetPosition = {x: videoWidth - IMGSIZE, y: videoHeight/2 - IMGSIZE/2};

class Img extends PickingTarget {
  constructor(x, y, path, index, size=IMGSIZE) {
    super(x, y, size);
    this.path = path;
    this.index = index;
    this.img = new Image();
    this.img.src = `./similar-imgs/${this.path}/${this.index}.png`;
  }

  drawPosition(ctx) {
    super.drawPosition();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.img, this.pos.x, this.pos.y);
  }
}

class SamePicking extends React.Component {
  constructor(props) {
    super(props);
    if (window.location.search === '') {
      window.location = '/same-picking?mode=avg';
    }

    this.state = {score: [], total: 0, started: false};
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
      const randomPath = shuffle(optionImgs)[0];
      for (let i=0; i<optionPositions.length; i++) {
        this.options.push(new Img(optionPositions[i].x, optionPositions[i].y, randomPath, i+1));
      }
      let toss = Math.floor(Math.random()*3) + 1;
      if (this.state.total === 0) {
        cueVoice.text = 'Move your hand to the matching picture';
        window.speechSynthesis.speak(cueVoice);
      }
      this.target = new Img(targetPosition.x, targetPosition.y, randomPath, toss);
    }

    this.target.drawPosition(this.ctx);
    for (let i=0; i<this.options.length; i++) {
      this.options[i].drawPosition(this.ctx);
      for (const temp of Object.entries(averagePoints)) {
        const pos = temp[1];
        let tempPos = {...this.options[i].pos};
        tempPos.x += IMGSIZE/2;
        tempPos.y += IMGSIZE/2;
        if (getDistance(pos, tempPos) <= 60) {
		      this.times.push(new Date());
          if (this.options[i].index === this.target.index) {
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
          title="Same Image Picking: Touch the exact same image on the right"
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
              type='samePicking'
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

export default SamePicking;
