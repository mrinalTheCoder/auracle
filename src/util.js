export function randomNumber(min, max) {
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
