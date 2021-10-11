import {TARGETSIZE, NOOB, ROLE_TARGET, TOUCHED, BINNED, ROLE_MIDPOINT} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';

const BINSIZE = TARGETSIZE;

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

export function getHandAverage(pointLists, handsList) {
  let out = {};
  for (var i=0; i<pointLists.length; i++) {
    let x = pointLists[i][0].x + pointLists[i][12].x;
    let y = pointLists[i][0].y + pointLists[i][12].y;
    x /= 2;
    y /= 2
    out[handsList[i].label] = {x:x, y:y};
  }
  return out;
}


export function getDistance(p1, p2) {
  // console.log(p1);
  // console.log(p2);
  return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
}

export class Target {
  constructor(shape,size) {
    this.pos = {
      x: randomNumber(BINSIZE +20 , videoWidth-100),
      y: randomNumber(BINSIZE/2+100, videoHeight-100),
    };
    this.size = size;
    this.shape = shape;
    this.frames = 0;
    this.color = 'yellow';
    //this.touched = false;
    this.touchedFrames = 0;
    this.followingHand = '';
    this.state = NOOB;
    this.role = ROLE_TARGET;
  }

  updateProp(size, color, pos, role) {
    this.size = size;
    this.color = color;
    this.updatePosition(pos);
    this.role = role;
  }

  binned() {
    this.state = BINNED;
  }

  updatePosition(pos) {
    this.pos = pos
  }

  drawPosition(ctx) {
    this.frames += 1;
    // if (this.frames > 25 && this.state != TOUCHED && this.role != ROLE_BIN) {
    //   this.size *= Math.exp(-.001*(this.frames - 25));
    // }
  //  this.pos.x += 1;
    if (this.state === TOUCHED) {
      this.touchedFrames += 1;
    }
  }
  matches(target) {
    return(this.shape===target.shape);
  }
}

export class Midpoint extends Target {
  constructor() {
    super('Circle', 10);
    this.role = ROLE_MIDPOINT;
    this.color = 'grey';
  }

  drawPosition(ctx, pos) {
    this.updatePosition(pos);
    super.drawPosition(ctx);
    ctx.fillStyle = this.color;
    //console.log(this.color);
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.size/2, 0, 2 * Math.PI, this.color);
    ctx.closePath();
    ctx.fill();
  }
}
