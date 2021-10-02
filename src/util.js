export function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

export function getHandAverage(pointLists) {
  let out = [];
  for (var i=0; i<pointLists.length; i++) {
    let x = 0;
    let y = 0;
    for (var j=0; j<pointLists[i].length; j++) {
      x += pointLists[i][j].x;
      y += pointLists[i][j].y;
    }
    x = x/pointLists[i].length;
    y = y/pointLists[i].length;
    out.push({x:x, y:y});
  }
  return out;
}


export function getDistance(p1, p2) {
  // console.log(p1);
  // console.log(p2);
  return Math.sqrt((p1.x-p2.x)**2 + (p1.y-p2.y)**2);
}
