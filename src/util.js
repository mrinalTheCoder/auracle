import {videoWidth, videoHeight} from './constants.js';

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
