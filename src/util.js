export function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

export function getHandAverage(pointLists, handsList) {
  let out = {};
  for (var i=0; i<pointLists.length; i++) {
    let x = 0;
    let y = 0;
    for (var j=0; j<pointLists[i].length; j++) {
      if (j ==0) {
        x += pointLists[i][j].x;
        y += 3*pointLists[i][j].y;
      } else {
        x += pointLists[i][j].x;
        y += pointLists[i][j].y;
      }
    }
    x = x/pointLists[i].length;
    y = y/pointLists[i].length;
    out[handsList[i].label] = {x:x, y:y};
  }
  return out;
}


export function getDistance(p1, p2) {
  // console.log(p1);
  // console.log(p2);
  return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
}
