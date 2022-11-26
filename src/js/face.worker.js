self.importScripts("static/js/faceEnvWorkerPatch.js");
self.importScripts("static/js/face-api.min.js");

class FaceApi {
  static async loadWeight() {
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
    // await this.faceapi.ageGenderNet.load(
    //   "/static/weights/age_gender_model-weights_manifest.json"
    // );
  }

  static async handleVideoFaceTracking() {
    const options = new faceapi.SsdMobilenetv1Options();
    // let task = faceapi.detectAllFaces(videoEl, options);
    // task = task.withFaceLandmarks();
    // const dims = faceapi.matchDimensions(overlayCanvas, videoEl, true);
    // const resizedResults = faceapi.resizeResults(results, dims);

    // console.log("options==>", options);
    // console.log("faceapi==>", faceapi);

    self.postMessage({
      type: "videoFaceTrack",
      options,
      // detectAllFaces: faceapi,
    });
  }
}

self.addEventListener(
  "message",
  async (e) => {
    console.log("子线程收到消息==>", e);
    let data = e.data;
    if (data) {
      if (data.startLoadWeight) {
        await FaceApi.loadWeight();

        self.postMessage({
          type: "loadEnd",
          loadEnd: true,
        });

        // self.close();
        // console.log("子线程已关闭==>");
      }

      if (data.videoFaceTracking) {
        console.log("data==>");
        await FaceApi.handleVideoFaceTracking();
      }
    }
  },
  false
);
