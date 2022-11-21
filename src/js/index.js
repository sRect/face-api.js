// import * as faceapi from "face-api.js";
import Worker from "./face.worker.js";
// import ikJPG from '@/assets/img/ik.jpg';

class AppBase {
  constructor() {
    this.worker = new Worker();
    this.video = document.querySelector("#video");
  }

  async loadWeight() {
    this.worker.postMessage({
      loadWeight: true,
    });

    this.worker.addEventListener("error", (e) => {
      console.log("worker加载失败", e);
    });
  }

  //打开摄像头
  async openUserMedia() {
    //获取设备
    this.deviceList = (await this.getDevice()) || [];
    const isOpen = await this.getUserMedia();
    if (isOpen.code == "ok") {
      await this.createModel();
      window.cancelAnimationFrame(this.task);
      this.task = window.requestAnimationFrame(this.recognition);
      // vant.Toast(`摄像头已打开`);
    } else {
      vant.Dialog.alert({
        title: "失败",
        message: `打开摄像头失败：${isOpen.errMsg}`,
        theme: "round-button",
      }).then(() => {
        this.openUserMedia();
      });
      return;
    }
  }

  getUserMedia() {
    return new Promise(async (resolve) => {
      this.isCameraOpen = false;
      const toast = vant.Toast.loading({
        duration: 0, // 持续展示 toast
        forbidClick: true,
        message: "打开摄像头",
      });
      let mediaOpts = {
        audio: false,
        video: true,
        video: {
          // width: this.width,
          // height: this.height,
          frameRate: {
            ideal: 100,
            max: 150,
          }, //最佳帧率
        },
      };
      if (this.deviceId === "user" || this.deviceId === "environment") {
        mediaOpts.video.facingMode = this.deviceId;
      } else if (this.deviceId) {
        mediaOpts.video.deviceId = this.deviceId;
      } else if (this.isPhone) {
        mediaOpts.video.facingMode = "user";
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia(mediaOpts);
        this.mediaStreamTrack = stream;
        //获取设备
        this.deviceList = (await this.getDevice()) || [];
        let video = this.$refs["video"];
        console.log(video);
        video.pause();
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        if ("srcObject" in video) {
          video.srcObject = stream;
        } else {
          video.src = stream;
        }
        video.play();
        video.onplaying = () => {
          toast.clear();
          // this.isCameraOpen = true;
          this.$nextTick((_) => {
            const { videoWidth, videoHeight } = this.$refs["video"];
            console.log("videoWidth", videoWidth);
            console.log("videoHeight", videoHeight);
            this.canvasWidth = videoWidth;
            this.canvasHeight = videoHeight;
            this.isCameraOpen = true;
          });
          resolve({
            code: `ok`,
          });
        };
      } catch (error) {
        toast.clear();
        console.log(error);
        console.error(error);
        resolve({
          errMsg: error,
        });
      }
    });
  }
  //获取设备信息
  getDevice() {
    return new Promise(async (resolve) => {
      const toast = vant.Toast.loading({
        duration: 0, // 持续展示 toast
        forbidClick: true,
        message: "获取设备中",
      });
      try {
        const arr = [];
        if (this.isPhone) {
          arr.push(
            {
              name: "前置摄像头",
              deviceId: "user",
            },
            {
              name: "后置摄像头",
              deviceId: "environment",
            }
          );
        } else {
          const devicesList = await navigator.mediaDevices.enumerateDevices();
          (devicesList || []).forEach((e) => {
            e.name = e.label || e.deviceId;
            if (
              e.kind === "videoinput" &&
              e.deviceId &&
              !e.name.includes("麦克风")
            ) {
              e.color = e.deviceId == this.deviceId ? "#1989fa" : "#323233";
              arr.push(e);
            }
          });
        }
        toast.clear();
        resolve(arr);
      } catch (error) {
        toast.clear();
        console.log(error);
        resolve([]);
      }
    });
  }
}

class DyImageSelect extends AppBase {
  constructor() {
    super();
  }

  async getUserMedia() {
    // navigator.getUserMedia =
    //   navigator.getUserMedia ||
    //   navigator.webkitGetUserMedia ||
    //   navigator.mozGetUserMedia ||
    //   navigator.msGetUserMedia; //获取媒体对象（这里指摄像头）
    // navigator.getUserMedia(
    //   {
    //     video: true,
    //   },
    //   gotStream,
    //   noStream
    // ); //参数1获取用户打开权限；参数二成功打开后调用，并传一个视频流对象，参数三打开失败后调用，传错误信息

    // function gotStream(stream) {
    //   this.video.src = URL.createObjectURL(stream);
    //   this.video.onerror = function () {
    //     stream.stop();
    //   };
    //   stream.onended = noStream;
    //   this.video.onloadedmetadata = function () {
    //     alert("摄像头成功打开！");
    //   };
    // }

    // function noStream(err) {
    //   alert(err);
    // }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
        // video: {
        //   facingMode: "user",
        //   width: window.innerWidth,
        //   height: window.innerHeight,
        // },
      });

      this.video.src = stream;

      return;
    }

    const errorMessage =
      "This browser does not support video capture, or this device does not have a camera";
    alert(errorMessage);
  }

  init() {
    this.loadWeight();

    this.worker.addEventListener("message", async (data) => {
      console.log("主线程收到消息==>", data);
      if (data.data.loadEnd) {
        await this.getUserMedia();
      }
    });
  }
}

const dyImageSelect = new DyImageSelect();

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  dyImageSelect.init();
});

// class ShowImage {
//   constructor() {
//     this.file = null;
//     this.imgWrap = document.querySelector("#imgWrap");
//   }

//   get inputFile() {
//     return document.querySelector("#inputFile");
//   }

//   get previewImg() {
//     return document.getElementById("previewImg");
//   }

//   previewImage(file) {
//     // 选择本地图片并预览
//     const previewImg = this.previewImg;
//     const fileBlob = new Blob([file]);
//     const fileReader = new FileReader();
//     fileReader.readAsDataURL(fileBlob);
//     fileReader.onload = (e) => {
//       const path = e.target.result;
//       previewImg.src = path;
//       previewImg.className = "img-responsive";
//       previewImg.style.width = "100%";
//       previewImg.addEventListener("load", () => {
//         previewImg.classList.remove("hide");
//       });
//     };
//   }

//   handleInputFileChange(e) {
//     console.log(e);
//     let target = e.target;
//     let file = target.files[0];
//     this.file = file;
//     this.previewImage(file);

//     const canvas = document.querySelector("#canvas");
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//   }

//   bindEvents() {
//     this.inputFile.addEventListener(
//       "change",
//       this.handleInputFileChange.bind(this)
//     );
//   }

//   init() {
//     this.bindEvents();
//   }
// }

// const showImage = new ShowImage();
// showImage.init();

// function faceLeftOrRight(result) {
//   const landmarks = result.landmarks;

//   let leftEye = landmarks.getLeftEye();
//   let rightEye = landmarks.getRightEye();
//   // let nose = landmarks.getNose();

//   let leftEyeSumPoint = leftEye.reduce((prev, cur) => ({
//     x: prev.x + cur.x,
//     y: prev.y + cur.y,
//   }));

//   let rightEyeSumPoint = rightEye.reduce((prev, cur) => ({
//     x: prev.x + cur.x,
//     y: prev.y + cur.y,
//   }));

//   // let noseSumPoint = nose.reduce((prev, cur) => ({
//   //   x: prev.x + cur.x,
//   //   y: prev.y + cur.y,
//   // }));

//   let leftEyeAvgPoint = {
//     x: leftEyeSumPoint.x / leftEye.length,
//     y: leftEyeSumPoint.y / leftEye.length,
//   };

//   let rightEyeAvgPoint = {
//     x: rightEyeSumPoint.x / leftEye.length,
//     y: rightEyeSumPoint.y / leftEye.length,
//   };

//   // let noseAvgPoint = {
//   //   x: noseSumPoint.x / leftEye.length,
//   //   y: noseSumPoint.y / leftEye.length,
//   // };

//   // console.log(leftEyeAvgPoint, rightEyeAvgPoint, noseAvgPoint);
//   let diff = Math.abs(leftEyeAvgPoint.y - rightEyeAvgPoint.y);

//   return diff > 5
//     ? leftEyeAvgPoint.y > rightEyeAvgPoint.y
//       ? "left"
//       : "right"
//     : "center";
// }

// class Face extends ShowImage {
//   constructor() {
//     super();

//     // this.file = null;
//     this.btn = document.querySelector("#btn");
//     this.canvas = document.querySelector("#canvas");
//     this.faceExtractionBtn = document.querySelector("#faceExtractionBtn");
//     this.faceExtractWrap = document.querySelector("#faceExtractWrap");
//     this.faceSimilarityBtn = document.querySelector("#faceSimilarityBtn");
//     this.normalWrap = document.querySelector(".normalWrap");
//     this.faceSimilaryWrap = document.querySelector(".faceSimilaryWrap");
//     this.faceSimilaryResult = document.querySelector("#faceSimilaryResult");
//     this.videoFaceTrackingBtn = document.querySelector("#videoFaceTrackingBtn");
//     this.videoWrap = document.querySelector("#videoWrap");
//     this.overlayCanvas = document.querySelector("#overlay");
//   }

//   async loadWeight() {
//     // 加载模型
//     await faceapi.nets.ssdMobilenetv1.load(
//       "/static/weights/ssd_mobilenetv1_model-weights_manifest.json"
//     );
//     await faceapi.nets.faceLandmark68Net.load(
//       "/static/weights/face_landmark_68_model-weights_manifest.json"
//     );
//     await faceapi.nets.faceExpressionNet.load(
//       "/static/weights/face_expression_model-weights_manifest.json"
//     );
//     await faceapi.nets.faceRecognitionNet.load(
//       "/static/weights/face_recognition_model-weights_manifest.json"
//     );
//     await faceapi.nets.ageGenderNet.load(
//       "/static/weights/age_gender_model-weights_manifest.json"
//     );
//   }

//   async getDetections() {
//     // 进行识别
//     const previewImg = this.previewImg;

//     if (!showImage.file) return alert("请选择图片！");

//     if (previewImg) {
//       const canvas = this.canvas;
//       const minProbability = 0.05;
//       const displaySize = {
//         width: previewImg.width,
//         height: previewImg.height,
//       };
//       const detections = await faceapi
//         .detectAllFaces(previewImg)
//         .withFaceLandmarks() // 人脸68特征
//         .withFaceExpressions() // 人脸表情识别
//         .withAgeAndGender(); // 年龄和性别识别
//       // .withFaceDescriptors();
//       console.log("detections", detections);

//       faceapi.matchDimensions(canvas, displaySize);
//       const resizedDetections = faceapi.resizeResults(detections, displaySize);
//       faceapi.draw.drawDetections(canvas, resizedDetections);
//       faceapi.draw.drawFaceExpressions(
//         canvas,
//         resizedDetections,
//         minProbability
//       );
//       faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

//       resizedDetections.forEach((result) => {
//         console.log("result==>", result);
//         console.log("result.detection==>", result.detection);
//         const { age, gender, genderProbability } = result;
//         new faceapi.draw.DrawTextField(
//           [
//             `${faceapi.utils.round(age, 0)} years`,
//             `${gender} (${faceapi.utils.round(genderProbability)})`,
//           ],
//           result.detection.box.topLeft
//         ).draw(canvas);

//         console.log(faceLeftOrRight(result));
//       });
//     }
//   }

//   async handleFaceExtractions() {
//     // 人脸提取
//     if (!showImage.file) return alert("请选择图片！");
//     const previewImg = this.previewImg;
//     if (previewImg) {
//       const canvas = this.canvas;
//       const options = new faceapi.SsdMobilenetv1Options();
//       const displaySize = {
//         width: previewImg.width,
//         height: previewImg.height,
//       };
//       const detections = await faceapi.detectAllFaces(previewImg, options);
//       const faceImages = await faceapi.extractFaces(previewImg, detections);

//       faceapi.matchDimensions(canvas, displaySize);
//       this.faceExtractWrap.innerHTML = "";

//       faceImages.forEach((canvas) => this.faceExtractWrap.appendChild(canvas));
//     }
//   }

//   async handleFaceSimilary() {
//     // 人脸相似度匹配(网络图片)
//     this.normalWrap.classList.add("hide");
//     this.faceSimilaryWrap.classList.remove("hide");

//     let descriptors = { desc1: null, desc2: null };
//     let img1Path =
//       "https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=172247787,4269461981&fm=26&gp=0.jpg";
//     let img2Path =
//       "https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=3796449256,3708092102&fm=26&gp=0.jpg";

//     function handler(status, imgPath) {
//       return new Promise((resolve, reject) => {
//         const img = new Image();
//         img.src = imgPath;
//         img.onload = async () => {
//           this.faceSimilaryWrap.appendChild(img);
//           const input = await faceapi.fetchImage(imgPath);
//           descriptors[status] = await faceapi.computeFaceDescriptor(input);
//           resolve(descriptors);
//         };
//       });
//     }

//     await handler.call(this, "desc1", img1Path);
//     await handler.call(this, "desc2", img2Path);
//     console.log("descriptors", descriptors);
//     if (descriptors.desc1 && descriptors.desc2) {
//       const threshold = 0.6;
//       const distance = faceapi.utils.round(
//         faceapi.euclideanDistance(descriptors.desc1, descriptors.desc2)
//       );
//       let text = distance;
//       let bgColor = "#ffffff";
//       if (distance > threshold) {
//         text += " (no match)";
//         bgColor = "#ce7575";
//       }
//       this.faceSimilaryResult.innerText = text;
//       this.faceSimilaryResult.style.backgroundColor = bgColor;
//     }
//   }

//   async handleVideoFaceTracking() {
//     this.videoWrap.classList.remove("hide");
//     const videoEl = this.videoWrap.querySelector("video");
//     // videoEl.src = 'static/video/1582447530235301.mp4';

//     if (!videoEl.currentTime || videoEl.paused || videoEl.ended) {
//       return setTimeout(() => this.handleVideoFaceTracking());
//     }

//     const options = new faceapi.SsdMobilenetv1Options();
//     // const ts = Date.now();
//     const drawBoxes = true; // 是否绘画人脸框
//     const drawLandmarks = false; // 是否绘制人脸特征
//     const withFaceLandmarks = true;

//     let task = faceapi.detectAllFaces(videoEl, options);
//     task = withFaceLandmarks ? task.withFaceLandmarks() : task;
//     const results = await task;

//     const dims = faceapi.matchDimensions(this.overlayCanvas, videoEl, true);
//     const resizedResults = faceapi.resizeResults(results, dims);

//     // console.log(resizedResults);

//     if (drawBoxes) {
//       faceapi.draw.drawDetections(this.overlayCanvas, resizedResults);
//     }
//     if (drawLandmarks) {
//       faceapi.draw.drawFaceLandmarks(this.overlayCanvas, resizedResults);
//     }

//     resizedResults.forEach((result) => {
//       // console.log("result.detection==>", result.detection);

//       let faceLeftOrRightResult = faceLeftOrRight(result);
//       new faceapi.draw.DrawTextField(
//         [`${faceLeftOrRightResult}`],
//         result.detection.box.topLeft
//       ).draw(this.overlayCanvas);
//     });

//     setTimeout(() => this.handleVideoFaceTracking());
//   }

//   bindEvents() {
//     this.btn.addEventListener("click", this.getDetections.bind(this));
//     this.faceExtractionBtn.addEventListener(
//       "click",
//       this.handleFaceExtractions.bind(this)
//     );
//     this.faceSimilarityBtn.addEventListener(
//       "click",
//       this.handleFaceSimilary.bind(this)
//     );
//     this.videoFaceTrackingBtn.addEventListener(
//       "click",
//       this.handleVideoFaceTracking.bind(this)
//     );
//   }

//   init() {
//     this.loadWeight();
//     this.bindEvents();
//   }
// }

// const face = new Face();
// face.init();

// 用于热更新
if (module.hot) {
  module.hot.accept();
}
