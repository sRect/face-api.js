import * as faceapi from "face-api.js";
// import ikJPG from '@/assets/img/ik.jpg';

console.log(faceapi.nets);

class ShowImage {
  constructor() {

    this.file = null;
    this.imgWrap = document.querySelector("#imgWrap");
  }

  get inputFile() {
    return document.querySelector("#inputFile");
  }

  get previewImg() {
    return document.getElementById("previewImg");
  }

  previewImage(file) { // 选择本地图片并预览
    const previewImg = this.previewImg;
    const fileBlob = new Blob([file]);
    const fileReader = new FileReader();
    fileReader.readAsDataURL(fileBlob);
    fileReader.onload = e => {
      const path = e.target.result;
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

    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    this.faceExtractionBtn = document.querySelector("#faceExtractionBtn");
    this.faceExtractWrap = document.querySelector("#faceExtractWrap");
    this.faceSimilarityBtn = document.querySelector("#faceSimilarityBtn");
    this.normalWrap = document.querySelector(".normalWrap");
    this.faceSimilaryWrap = document.querySelector(".faceSimilaryWrap");
    this.faceSimilaryResult = document.querySelector("#faceSimilaryResult");
  }

  async loadWeight() { // 加载模型
    await faceapi.nets.ssdMobilenetv1.load('/static/weights/ssd_mobilenetv1_model-weights_manifest.json');
    await faceapi.nets.faceLandmark68Net.load('/static/weights/face_landmark_68_model-weights_manifest.json');
    await faceapi.nets.faceExpressionNet.load('/static/weights/face_expression_model-weights_manifest.json');
    await faceapi.nets.faceRecognitionNet.load('/static/weights/face_recognition_model-weights_manifest.json');
    await faceapi.nets.ageGenderNet.load('/static/weights/age_gender_model-weights_manifest.json');
  }

  async getDetections() { // 进行识别
    const previewImg = this.previewImg;
    if (previewImg) {
      const canvas = this.canvas;
      const minProbability = 0.05;
      const displaySize = { width: previewImg.width, height: previewImg.height };
      const detections = await faceapi
        .detectAllFaces(previewImg)
        .withFaceLandmarks() // 人脸68特征
        .withFaceExpressions() // 人脸表情识别
        .withAgeAndGender() // 年龄和性别识别
        // .withFaceDescriptors()
      console.log("detections", detections);
      
      faceapi.matchDimensions(canvas, displaySize);
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      resizedDetections.forEach(result => {
        console.log(result);
        const { age, gender, genderProbability } = result
        new faceapi.draw.DrawTextField(
          [
            `${faceapi.utils.round(age, 0)} years`,
            `${gender} (${faceapi.utils.round(genderProbability)})`
          ],
          result.detection.box.topLeft
        ).draw(canvas)
      })
    }
  }

  async handleFaceExtractions() { // 人脸提取
    const previewImg = this.previewImg;
    if (previewImg) {
      const canvas = this.canvas;
      const options = new faceapi.SsdMobilenetv1Options();
      const displaySize = { width: previewImg.width, height: previewImg.height };
      const detections = await faceapi.detectAllFaces(previewImg, options);
      const faceImages = await faceapi.extractFaces(previewImg, detections);

      faceapi.matchDimensions(canvas, displaySize);
      this.faceExtractWrap.innerHTML = "";

      faceImages.forEach(canvas => this.faceExtractWrap.appendChild(canvas));
    }
    
  }

  async handleFaceSimilary() { // 人脸相似度匹配
    this.normalWrap.classList.add('hide');
    this.faceSimilaryWrap.classList.remove('hide');

    let descriptors = { desc1: null, desc2: null };
    let img1Path = '/timg?image&quality=80&size=b9999_10000&sec=1578055497359&di=b0c7c64e034d028ea18bef37f3b99ec7&imgtype=0&src=http%3A%2F%2Fwx4.sinaimg.cn%2Flarge%2Fa9395713ly1g17zeaheylj20e40e4wig.jpg';
    let img2Path = '/timg?image&quality=80&size=b9999_10000&sec=1578055530393&di=f95e50a2f8b053e9d512a2b7a3628ee9&imgtype=0&src=http%3A%2F%2Fi0.hdslb.com%2Fbfs%2Farticle%2F6f4982a2ef65821da1107e789a1510e6a9e4d291.jpg';

    function handler(status, imgPath) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imgPath;
        img.onload = async () => {
          this.faceSimilaryWrap.appendChild(img);
          const input = await faceapi.fetchImage(imgPath)
          descriptors[status] = await faceapi.computeFaceDescriptor(input);
          resolve(descriptors);
        }
      })
    }
    
    await handler.call(this, "desc1", img1Path);
    await handler.call(this, "desc2", img2Path);
    console.log("descriptors", descriptors);
    if (descriptors.desc1 && descriptors.desc2) {
      const threshold = 0.6;
      const distance = faceapi.utils.round(
        faceapi.euclideanDistance(descriptors.desc1, descriptors.desc2)
      );
      let text = distance;
      let bgColor = '#ffffff'
      if (distance > threshold) {
        text += ' (no match)'
        bgColor = '#ce7575'
      };
      this.faceSimilaryResult.innerText = text;
      this.faceSimilaryResult.style.backgroundColor = bgColor;
    }
  }

  bindEvents() {
    this.btn.addEventListener("click", this.getDetections.bind(this));
    this.faceExtractionBtn.addEventListener('click', this.handleFaceExtractions.bind(this));
    this.faceSimilarityBtn.addEventListener('click', this.handleFaceSimilary.bind(this));
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