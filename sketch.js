let video;
let bodyPose;
let poses = [];
let connections;
let cnv;
let pg;

let isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
let rotationAngle = 0; // radians

function preload() {
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  pg = createGraphics(640, 480);

  bodyPose.detectStart(video, gotPoses);
  connections = bodyPose.getSkeleton();

  // ---- iOS: rotate skeleton 90° counter‑clockwise ----
  if (isIOS) {
    rotationAngle = -PI / 2; // try PI/2 if it's the other way
  }
}

function gotPoses(results) {
  poses = results;
}

function draw() {
  // ---- Aspect ratio: fit 640x480 video into canvas ----
  let vidW = 640,
    vidH = 480;
  let vidAspect = vidW / vidH;
  let cnvAspect = width / height;
  let drawW, drawH, offsetX, offsetY;

  if (cnvAspect > vidAspect) {
    drawH = height;
    drawW = height * vidAspect;
    offsetX = (width - drawW) / 2;
    offsetY = 0;
  } else {
    drawW = width;
    drawH = width / vidAspect;
    offsetX = 0;
    offsetY = (height - drawH) / 2;
  }

  // Draw the video upright
  image(video, offsetX, offsetY, drawW, drawH);

  // Clear the graphics layer
  pg.clear();

  // ---- Rotate ONLY the skeleton inside pg ----
  pg.push();
  pg.translate(320, 240); // centre of 640×480
  pg.rotate(rotationAngle);
  pg.translate(-320, -240);

  // Draw skeleton connections
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    for (let j = 0; j < connections.length; j++) {
      let pointAIndex = connections[j][0];
      let pointBIndex = connections[j][1];
      let pointA = pose.keypoints[pointAIndex];
      let pointB = pose.keypoints[pointBIndex];
      if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
        pg.stroke(0, 255, 0);
        pg.strokeWeight(6);
        pg.line(pointA.x, pointA.y, pointB.x, pointB.y);
      }
    }

    // Face box and label ("ART WORKER")
    let nose = pose.keypoints.find((k) => k.name === "nose");
    let leftEye = pose.keypoints.find((k) => k.name === "left_eye");
    let rightEye = pose.keypoints.find((k) => k.name === "right_eye");

    if (nose && leftEye && rightEye) {
      let x = (leftEye.x + rightEye.x) / 2;
      let y = (leftEye.y + rightEye.y) / 2;
      let w = dist(leftEye.x, leftEye.y, rightEye.x, rightEye.y) * 3;
      let h = w * 1.2;

      pg.fill(255, 0, 0);
      pg.noStroke();
      pg.textSize(36);
      pg.textAlign(CENTER, CENTER);
      pg.text("ART WORKER", x, y - h / 2 - 15); // <--- HERE

      pg.noFill();
      pg.stroke(0, 255, 0);
      pg.strokeWeight(6);
      pg.rect(x - w / 2, y - h / 2, w, h);
    }
  }

  pg.pop(); // restore pg coordinate system

  // Draw the (now rotated) skeleton overlay, scaled to match the video
  image(pg, offsetX, offsetY, drawW, drawH);
}

// ---- Handle window resize / orientation change ----
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
