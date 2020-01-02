import * as faceapi from "face-api.js";
import ikJPG from '@/assets/img/ik.jpg';

console.log(faceapi.nets);

class ShowImage {
  constructor() {

    this.file = null;
    this.imgWrap = document.querySelector("#imgWrap");
    this.base64 = null;
  }

  get inputFile() {
    return document.querySelector("#inputFile");
  }

  get previewImg() {
    return document.querySelector("#previewImg");
  }

  get imgBase64() {
    return this.base64;
  }

  previewImage(file) { // 选择本地图片并预览
    const previewImg = this.previewImg;
    const fileBlob = new Blob([file]);
    const fileReader = new FileReader();
    fileReader.readAsDataURL(fileBlob);
    fileReader.onload = e => {
      const path = e.target.result;
      this.base64 = path;
      previewImg.src = path;
      previewImg.className = 'img-responsive';
      previewImg.style.width = '100%';
      previewImg.addEventListener('load', () => {
        previewImg.classList.remove("hide");
      })
    }
  }

  handleInputFileChange(e) {
    console.log(e);
    let target = e.target;
    let file = target.files[0];
    this.file = file;
    this.previewImage(file);
  }

  bindEvents() {
    this.inputFile.addEventListener("change", this.handleInputFileChange.bind(this))
  }

  init() {
    this.bindEvents();
  }
}

const showImage = new ShowImage();
showImage.init();

class Face extends ShowImage {
  constructor() {
    super();

    this.file = null;
    this.btn = document.querySelector("#btn");
    this.canvas = document.querySelector("#canvas");
  }

  async loadWeight() {
    await faceapi.nets.ssdMobilenetv1.load('/static/weights/ssd_mobilenetv1_model-weights_manifest.json');
    await faceapi.nets.faceLandmark68Net.load('/static/weights/face_landmark_68_model-weights_manifest.json');
    await faceapi.nets.faceExpressionNet.load('/static/weights/face_expression_model-weights_manifest.json');
    await faceapi.nets.faceRecognitionNet.load('/static/weights/face_recognition_model-weights_manifest.json');
    await faceapi.nets.ageGenderNet.load('/static/weights/age_gender_model-weights_manifest.json');
  }

  async getDetections() {
    const previewImg = this.previewImg;
    if (previewImg) {
      // all faces
      const detections = await faceapi
        .detectAllFaces(previewImg)
        .withFaceLandmarks()
        // .withFaceExpressions()
        // .withAgeAndGender()
        // .withFaceDescriptors()
      console.log("detections", detections);
      const displaySize = { width: this.previewImg.width, height: this.previewImg.height };
      // const ctx = this.canvas.getContext("2d");
      // ctx.drawImage(this.previewImg, 0, 0);
      // faceapi.matchDimensions(this.canvas, displaySize);

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(this.canvas, resizedDetections);
      // const minProbability = 0.05;
      // faceapi.draw.drawFaceExpressions(this.canvas, resizedDetections, minProbability);
      faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
    }
  }

  bindEvents() {
    this.btn.addEventListener("click", this.getDetections.bind(this))
  }

  init() {
    this.loadWeight();
    this.bindEvents();
  }
}

const face = new Face();
face.init();



// 用于热更新
if (module.hot) {
  module.hot.accept();
}