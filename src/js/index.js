import * as faceapi from "face-api.js";
// import Worker from "./face.worker.js";

// console.log(faceapi);

class App {
  constructor() {
    this.closed = true;
    this.timer = null;
    // this.worker = new Worker();
    this.video = document.querySelector("#video");
    this.startBtn = document.querySelector("#startBtn");
    this.closeBtn = document.querySelector("#closeBtn");
    this.imgSelectWrap = document.querySelector("#imgSelectWrap");
    this.overlay = document.querySelector("#overlay");
    this.warn = document.querySelector("#warn");
    this.heart = document.querySelector("#heart");
    this.left = document.querySelector("#left");
    this.right = document.querySelector("#right");
  }

  handleFaceLeftOrRight(landmarks) {
    // const landmarks = result.landmarks;

    let leftEye = landmarks.getLeftEye();
    let rightEye = landmarks.getRightEye();
    // let nose = landmarks.getNose();

    let leftEyeSumPoint = leftEye.reduce((prev, cur) => ({
      x: prev.x + cur.x,
      y: prev.y + cur.y,
    }));

    let rightEyeSumPoint = rightEye.reduce((prev, cur) => ({
      x: prev.x + cur.x,
      y: prev.y + cur.y,
    }));

    // let noseSumPoint = nose.reduce((prev, cur) => ({
    //   x: prev.x + cur.x,
    //   y: prev.y + cur.y,
    // }));

    let leftEyeAvgPoint = {
      x: leftEyeSumPoint.x / leftEye.length,
      y: leftEyeSumPoint.y / leftEye.length,
    };

    let rightEyeAvgPoint = {
      x: rightEyeSumPoint.x / leftEye.length,
      y: rightEyeSumPoint.y / leftEye.length,
    };

    // let noseAvgPoint = {
    //   x: noseSumPoint.x / leftEye.length,
    //   y: noseSumPoint.y / leftEye.length,
    // };

    // console.log(leftEyeAvgPoint, rightEyeAvgPoint, noseAvgPoint);
    let diff = Math.abs(leftEyeAvgPoint.y - rightEyeAvgPoint.y);

    return diff > 15
      ? leftEyeAvgPoint.y > rightEyeAvgPoint.y
        ? "left"
        : "right"
      : "center";
  }

  async loadWeight() {
    // 加载模型
    await faceapi.nets.ssdMobilenetv1.load(
      "/static/weights/ssd_mobilenetv1_model-weights_manifest.json"
    );
    await faceapi.nets.faceLandmark68Net.load(
      "/static/weights/face_landmark_68_model-weights_manifest.json"
    );
    // await faceapi.nets.faceExpressionNet.load(
    //   "/static/weights/face_expression_model-weights_manifest.json"
    // );
    // await faceapi.nets.faceRecognitionNet.load(
    //   "/static/weights/face_recognition_model-weights_manifest.json"
    // );
    await faceapi.nets.ageGenderNet.load(
      "/static/weights/age_gender_model-weights_manifest.json"
    );

    console.log("模型加载完成");
  }

  async handleVideoFaceTracking() {
    if (this.closed) {
      clearTimeout(this.timer);
      return;
    }

    const options = new faceapi.SsdMobilenetv1Options();

    let task = faceapi.detectAllFaces(this.video, options);
    task = task.withFaceLandmarks().withAgeAndGender();
    const results = await task;

    const dims = faceapi.matchDimensions(this.overlay, this.video, true);
    const resizedResults = faceapi.resizeResults(results, dims);

    // console.log("options==>", options);
    console.log("resizedResults==>", resizedResults);
    if (resizedResults.length) {
      requestAnimationFrame(() => {
        !this.warn.classList.contains("hidden") &&
          this.warn.classList.add("hidden");
      });

      resizedResults.forEach((result) => {
        let { landmarks, gender, genderProbability } = result;
        // let gender = result.gender; // male 男
        // let genderProbability = result.genderProbability;
        // console.log("result.detection==>", result.detection);

        let resultStr = this.handleFaceLeftOrRight(landmarks);
        console.log("resultStr==>", resultStr);

        switch (resultStr) {
          case "center":
            this.heart.classList.remove("heartLeftActive");
            this.heart.classList.remove("heartRightActive");
            this.left.classList.remove("leftActive");
            this.right.classList.remove("rightActive");
            break;
          case "left":
            this.heart.classList.remove("heartLeftActive");
            this.heart.classList.remove("heartRightActive");
            this.left.classList.remove("leftActive");
            this.right.classList.remove("rightActive");

            this.heart.classList.add("heartRightActive");
            this.right.classList.add("rightActive");
            break;
          case "right":
            this.heart.classList.remove("heartLeftActive");
            this.heart.classList.remove("heartRightActive");
            this.left.classList.remove("leftActive");
            this.right.classList.remove("rightActive");

            this.heart.classList.add("heartLeftActive");
            this.left.classList.add("leftActive");
            break;
          default:
            break;
        }
      });
    } else {
      this.warn.classList.remove("hidden");
    }

    this.timer = setTimeout(() => this.handleVideoFaceTracking());
  }
}

class DyImageSelect extends App {
  constructor() {
    super();

    // window.devicePixelRatio
    this.width = document.documentElement.clientWidth;
    this.height = document.documentElement.clientHeight;
  }

  // 获取摄像头视频流
  async getUserMedia() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#examples
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
          video: {
            facingMode: "user", // 前置摄像头
            // facingMode: { exact: "environment" }，// 后置摄像头
            // width: { min: 1280, max: 1920 },
            // height: { min: 720, max: 1280 },
            width: this.width,
            height: this.height,
          },
        });

        return Promise.resolve(stream);
      } catch (error) {
        return Promise.reject();
      }
    }

    const errorMessage =
      "This browser does not support video capture, or this device does not have a camera";
    alert(errorMessage);
  }

  // 打开摄像头
  async openCamera(e) {
    e.stopPropagation();
    this.closed = false;
    this.startBtn.setAttribute("disabled", "disabled");
    this.startBtn.classList.add("loading");

    const stream = await this.getUserMedia();
    this.video.srcObject = stream;
    this.video.onloadedmetadata = async () => {
      this.startBtn.classList.remove("loading");
      this.startBtn.classList.add("hidden");
      this.closeBtn.classList.remove("hidden");
      this.imgSelectWrap.classList.remove("hidden");
      this.video.play();

      await this.handleVideoFaceTracking();
    };
  }

  // 关闭摄像头
  async closeCamera() {
    this.closed = true;
    clearTimeout(this.timer);
    this.startBtn.classList.remove("loading");
    this.startBtn.classList.remove("hidden");
    this.closeBtn.classList.add("hidden");
    this.imgSelectWrap.classList.add("hidden");
    this.startBtn.removeAttribute("disabled");
    this.warn.classList.add("hidden");
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop
    const tracks = this.video.srcObject.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    this.video.srcObject.srcObject = null;
  }

  async init() {
    await this.loadWeight();

    this.startBtn.removeAttribute("disabled");

    const handleOpenCamera = this.openCamera.bind(this);
    const handleCloseCamera = this.closeCamera.bind(this);

    this.startBtn.addEventListener("click", handleOpenCamera);
    this.closeBtn.addEventListener("click", handleCloseCamera);
  }
}

const dyImageSelect = new DyImageSelect();

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  dyImageSelect.init();
});

// 用于热更新
if (module.hot) {
  module.hot.accept();
}
