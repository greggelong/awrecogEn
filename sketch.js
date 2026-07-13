let video;
let bodyPose;
let poses = [];
let connections;
let cnv;
let pg;

let isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
let rotationAngle = 0; // radians, only used on iOS

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

  // ---- Auto-rotate for iOS ----
  if (isIOS) {
    // On iPhone in portrait, the video is rotated 90° clockwise.
    // We counter-rotate by -90° (or +90° depending on device)
    rotationAngle = -PI / 2; // adjust if needed
    // If you want to detect orientation dynamically, you can use:
    // updateRotation() as shown later, but -90 works for most.
  }
}

function gotPoses(results) {
  poses = results;
}

function draw() {
  // Aspect-ratio calculation (unchanged)
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

  pg.clear();

  // ---- Draw skeleton onto pg ----
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
      pg.text("艺术工人", x, y - h / 2 - 15);

      pg.noFill();
      pg.stroke(0, 255, 0);
      pg.strokeWeight(6);
      pg.rect(x - w / 2, y - h / 2, w, h);
    }
  }

  // ---- Draw video and overlay, rotated if on iOS ----
  push();
  translate(offsetX + drawW / 2, offsetY + drawH / 2);
  if (isIOS) rotate(rotationAngle);
  image(video, -drawW / 2, -drawH / 2, drawW, drawH);
  image(pg, -drawW / 2, -drawH / 2, drawW, drawH);
  pop();
}

// ---- Window resize (keep) ----
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
