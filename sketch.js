let video;
let bodyPose;
let poses = [];
let connections;
let cnv;
let pg;

// ---- SMOOTHING: store smoothed keypoints ----
let smoothedPoses = [];
const LERP_AMOUNT = 0.3; // lower = smoother, higher = more responsive

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
  poses = results;

  // ---- SMOOTHING: initialise or update smoothed keypoints ----
  if (poses.length > 0) {
    if (smoothedPoses.length === 0) {
      // First detection: copy raw data
      smoothedPoses = poses.map((p) =>
        p.keypoints.map((k) => ({ x: k.x, y: k.y, confidence: k.confidence })),
      );
    } else {
      // Subsequent detections: lerp towards new raw values
      for (let i = 0; i < poses.length; i++) {
        // If we have fewer poses than before, add new ones
        if (i >= smoothedPoses.length) {
          smoothedPoses.push(
            poses[i].keypoints.map((k) => ({
              x: k.x,
              y: k.y,
              confidence: k.confidence,
            })),
          );
          continue;
        }
        let rawKeypoints = poses[i].keypoints;
        let smoothKeypoints = smoothedPoses[i];
        for (let j = 0; j < rawKeypoints.length; j++) {
          smoothKeypoints[j].x = lerp(
            smoothKeypoints[j].x,
            rawKeypoints[j].x,
            LERP_AMOUNT,
          );
          smoothKeypoints[j].y = lerp(
            smoothKeypoints[j].y,
            rawKeypoints[j].y,
            LERP_AMOUNT,
          );
          smoothKeypoints[j].confidence = rawKeypoints[j].confidence; // keep fresh
        }
      }
      // If we now have fewer poses, trim the smoothed array
      while (smoothedPoses.length > poses.length) {
        smoothedPoses.pop();
      }
    }
  } else {
    // No poses detected – clear smoothed data
    smoothedPoses = [];
  }
}

function draw() {
  // ---- ASPECT RATIO: fit 640x480 video into canvas without stretching ----
  let vidW = 640;
  let vidH = 480;
  let vidAspect = vidW / vidH;
  let cnvAspect = width / height;
  let drawW, drawH, offsetX, offsetY;

  if (cnvAspect > vidAspect) {
    // Canvas is wider – fit to height
    drawH = height;
    drawW = height * vidAspect;
    offsetX = (width - drawW) / 2;
    offsetY = 0;
  } else {
    // Canvas is taller – fit to width
    drawW = width;
    drawH = width / vidAspect;
    offsetX = 0;
    offsetY = (height - drawH) / 2;
  }

  // Draw the video with correct proportions
  image(video, offsetX, offsetY, drawW, drawH);

  // Clear the graphics layer (which stays at 640x480)
  pg.clear();

  // ---- Use smoothed keypoints for drawing ----
  for (let i = 0; i < smoothedPoses.length; i++) {
    let pose = smoothedPoses[i]; // smoothed data
    // (pose is an array of keypoints with x, y, confidence)

    // Draw skeleton connections
    for (let j = 0; j < connections.length; j++) {
      let pointAIndex = connections[j][0];
      let pointBIndex = connections[j][1];
      let pointA = pose[pointAIndex];
      let pointB = pose[pointBIndex];
      if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
        pg.stroke(0, 255, 0);
        pg.strokeWeight(6);
        pg.line(pointA.x, pointA.y, pointB.x, pointB.y);
      }
    }

    // Draw face box and label (using smoothed positions)
    // We need to find nose, left_eye, right_eye by name.
    // Since smoothedPoses stores just arrays, we need the original pose to get names,
    // or we can store names alongside. Quick fix: use the raw pose (poses[i]) for name lookup,
    // but take coordinates from smoothedPoses[i].
    let rawPose = poses[i]; // raw data for name lookup (confidence too)
    if (!rawPose) continue;

    let noseRaw = rawPose.keypoints.find((k) => k.name === "nose");
    let leftEyeRaw = rawPose.keypoints.find((k) => k.name === "left_eye");
    let rightEyeRaw = rawPose.keypoints.find((k) => k.name === "right_eye");

    if (noseRaw && leftEyeRaw && rightEyeRaw) {
      // Find corresponding indices in the raw pose to get smoothed values
      let idxNose = rawPose.keypoints.indexOf(noseRaw);
      let idxLeft = rawPose.keypoints.indexOf(leftEyeRaw);
      let idxRight = rawPose.keypoints.indexOf(rightEyeRaw);

      let nose = pose[idxNose];
      let leftEye = pose[idxLeft];
      let rightEye = pose[idxRight];

      if (
        nose &&
        leftEye &&
        rightEye &&
        nose.confidence > 0.1 &&
        leftEye.confidence > 0.1 &&
        rightEye.confidence > 0.1
      ) {
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
  }

  // Draw the graphics layer with the same scaling/offset as the video
  image(pg, offsetX, offsetY, drawW, drawH);
}
