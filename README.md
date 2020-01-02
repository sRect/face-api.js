## face-api.js demo
> [face-api.js github](https://github.com/justadudewhohacks/face-api.js)
> [「圣诞特辑」纯前端实现人脸识别自动佩戴圣诞帽](https://mp.weixin.qq.com/s/44ZIsKHypqhQ_6354chVyw)

### 安装
```bash
npm i -S face-api.js
```

### 导入
```javascript
import * as faceapi from "face-api.js";
```

### 加载模型
> [官方仓库提供了已经训练好的模型，我们可以直接下载导入使用](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

```javascript
async loadWeight() {
  await faceapi.nets.ssdMobilenetv1.load('/static/weights/ssd_mobilenetv1_model-weights_manifest.json');
  await faceapi.nets.faceLandmark68Net.load('/static/weights/face_landmark_68_model-weights_manifest.json');
  await faceapi.nets.faceExpressionNet.load('/static/weights/face_expression_model-weights_manifest.json');
  await faceapi.nets.faceRecognitionNet.load('/static/weights/face_recognition_model-weights_manifest.json');
  await faceapi.nets.ageGenderNet.load('/static/weights/age_gender_model-weights_manifest.json');
}
```

### 获取图片数据
```javascript
async getDetections() {
  const previewImg = this.previewImg;
  if (previewImg) {
    // all faces
    const detections = await faceapi
      .detectAllFaces(previewImg)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors()
    console.log("detections", detections);
  }
}
```
### 处理数据绘制图形
```javascript
const displaySize = { width: this.previewImg.width, height: this.previewImg.height };
const minProbability = 0.05;

faceapi.matchDimensions(this.canvas, displaySize);
const resizedDetections = faceapi.resizeResults(detections, displaySize);
faceapi.draw.drawDetections(this.canvas, resizedDetections);
faceapi.draw.drawFaceExpressions(this.canvas, resizedDetections, minProbability);
faceapi.draw.drawFaceLandmarks(this.canvas, resizedDetections);
```
