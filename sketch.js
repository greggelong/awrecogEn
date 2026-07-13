let video;
let bodyPose;
let poses = [];
let connections;
let cnv;
let pg;

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
}

function gotPoses(results) {
  poses = results; // simple, no smoothing
}

function draw() {
  // ---- ASPECT RATIO: fit 640x480 video into canvas without stretching ----
  let vidW = 640;
  let vidH = 480;
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

  // Draw video
  image(video, offsetX, offsetY, drawW, drawH);

  // Clear graphics layer
  pg.clear();

  // ---- Draw skeleton from raw poses (original) ----
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];

    // Skeleton connections
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

    // Face box and label
    let nose = pose.keypoints.find((k) => k.name === "nose");
    let leftEye = pose.keypoints.find((k) => k.name === "left_eye");
    let rightEye = pose.keypoints.find((k) => k.name === "right_eye");

    if (nose && leftEye && rightEye) {
      // Use raw keypoints directly
      let x = (leftEye.x + rightEye.x) / 2;
      let y = (leftEye.y + rightEye.y) / 2;
      let w = dist(leftEye.x, leftEye.y, rightEye.x, rightEye.y) * 3;
      let h = w * 1.2;

      pg.fill(255, 0, 0);
      pg.noStroke();
      pg.textSize(26);
      pg.textAlign(CENTER, CENTER);
      pg.text("ART WORKER", x, y - h / 2 - 15);

      pg.noFill();
      pg.stroke(0, 255, 0);
      pg.strokeWeight(6);
      pg.rect(x - w / 2, y - h / 2, w, h);
    }
  }

  // Draw the graphics layer with the same scaling/offset as the video
  image(pg, offsetX, offsetY, drawW, drawH);
}
