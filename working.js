let video;
let bodyPose;
let poses = [];
let connections;
let cnv;
let pg; //graphics layer for skeleton

function preload() {
  // Load the bodyPose model
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  let cx = (windowWidth - cnv.width) / 2;
  let cy = (windowHeight - cnv.height) / 2;
  //cnv.position(cx, cy);
  pixelDensity(1);

  // Create the video and hide it
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  // create graphics layer for skeleton
  pg = createGraphics(640, 480);

  // Start detecting poses in the webcam video
  bodyPose.detectStart(video, gotPoses);
  // Get the skeleton connection information
  connections = bodyPose.getSkeleton();
}

function gotPoses(results) {
  poses = results;
}

function draw() {
  // Draw the webcam video

  image(video, 0, 0, width, height);
  pg.clear();

  // Draw the skeleton connections
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    for (let j = 0; j < connections.length; j++) {
      let pointAIndex = connections[j][0];
      let pointBIndex = connections[j][1];
      let pointA = pose.keypoints[pointAIndex];
      let pointB = pose.keypoints[pointBIndex];
      // Only draw a line if both points are confident enough
      if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
        pg.stroke(0, 255, 0);
        pg.strokeWeight(6);
        pg.line(pointA.x, pointA.y, pointB.x, pointB.y);
      }
    }
  }

  // Draw all the tracked landmark points and place a label around the face
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].keypoints;
    let nose = pose.find((k) => k.name === "nose");
    let leftEye = pose.find((k) => k.name === "left_eye");
    let rightEye = pose.find((k) => k.name === "right_eye");

    if (nose && leftEye && rightEye) {
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
  image(pg, 0, 0, width, height);
}
