import {NOOB, ROLE_TARGET, ROLE_MIDPOINT, BINNED, TOUCHED, TARGETSIZE} from './constants.js';
import {videoWidth, videoHeight} from './constants.js';

const BINSIZE = TARGETSIZE;

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

export class PickingTarget {
  constructor(x, y, size) {
    this.pos = {x: x, y: y};
    this.size = size;
    this.frames = 0;
    this.color = 'yellow';
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

  drawPosition() {
    this.frames += 1;
    if (this.state === TOUCHED) {
      this.touchedFrames += 1;
    }
  }

  matches(target, criteria) {
    return(this[criteria] === target[criteria]);
  }
}

export class MatchingTarget {
  constructor(shape,size) {
    this.pos = {
      x: randomNumber(BINSIZE +20 , videoWidth-100),
      y: randomNumber(BINSIZE/2+100, videoHeight-100),
    };
    this.size = size;
    this.shape = shape;
    this.frames = 0;
    this.color = 'darkorange';
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

  drawPosition() {
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

export class Midpoint extends MatchingTarget {
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
