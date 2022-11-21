const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const WebpackBuildNotifierPlugin = require("webpack-build-notifier");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env) => {
  console.log("env=======>", env);
  const isDev = env.development ? "development" : "production";
  return {
    mode: isDev,
    devtool: "eval-source-map",
    entry: path.resolve(__dirname, "./src/js/index.js"),
    output: {
      filename: "[name].[hash:8].js",
      chunkFilename: "[name].[hash:8].min.js",
      path: path.resolve(__dirname, "./dist"),
      globalObject: "this",
    },
    resolve: {
      extensions: [".js", ".js", ".json"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        static: path.resolve(__dirname, "./public/static"),
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: "babel-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.worker\.js$/,
          use: [
            {
              loader: "worker-loader",
              options: {
                esModule: true,
              },
            },
            {
              loader: "babel-loader",
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.(jpe?g|png|gif)$/,
          use: {
            loader: "url-loader",
            options: {
              limit: 8 * 1024, // 如果大于8k图片，会默认使用file-loader(file-loader作用就是拷贝)
              outputPath: "images/",
              name: "[name].[hash:8].[ext]",
            },
          },
        },
      ],
    },
    plugins: [
      !env.development && new CleanWebpackPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "./public/index.html"),
        filename: "index.html",
        title: "face-api",
        hash: true,
        minify: !env.development && {
          collapseWhitespace: true, // 折叠空行
          removeAttributeQuotes: true, // 去除双引号
        },
        // chunks: ['index'] // index.html 引入index.js
      }),
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, "./public/static"), //要打包的静态资源目录地址
          to: "./static", //要打包到的文件夹路径，跟随output配置中的目录。所以不需要再自己加__dirname
        },
      ]),
      new webpack.DefinePlugin({
        // 定义全局变量
        VERSION: "123",
      }),
      new webpack.ProvidePlugin({
        // 变量暴露给全局window
        $: "jQuery",
        // faceapi: "face-api.js",
      }),
      new FriendlyErrorsWebpackPlugin(),
      new WebpackBuildNotifierPlugin({
        title: "My Project Webpack Build",
        // logo: path.resolve("./img/favicon.png"),
        suppressSuccess: true,
      }),
    ].filter(Boolean), // 过滤数组中的false
    optimization: {
      // https://juejin.im/post/5af1677c6fb9a07ab508dabb
      runtimeChunk: {
        name: "manifest",
      },
      occurrenceOrder: true, // To keep filename consistent between different modes (for example building only)
      splitChunks: {
        chunks: "all", // 必须三选一： "initial"(只处理同步) | "all"(推荐) | "async" (处理异步，默认就是async)
        minSize: 30000, // 最小尺寸，超过30k就抽离
        minChunks: 1, // 最小 chunk ，默认1
        maxAsyncRequests: 5, // 最大异步请求数， 默认5
        maxInitialRequests: 3, //  最多首屏加载请求数，默认3
        automaticNameDelimiter: "~", // 打包分隔符
        automaticNameMaxLength: 30, // 最长名字大小
        cacheGroups: {
          vendor: {
            // 抽离第三方插件
            test: /node_modules/, // 指定是node_modules下的第三方包
            chunks: "initial",
            minChunks: 1,
            maxInitialRequests: 5,
            minSize: 2,
            name: "vendor", // 打包后的文件名，任意命名
            priority: 10, // 设置优先级，防止和自定义的公共代码提取时被覆盖，不进行打包
            enforce: true,
          },
          commons: {
            // 抽离自己写的公共代码
            chunks: "initial",
            name: "common", // 打包后的文件名，任意命名
            minChunks: 2, //最小引用2次
            maxInitialRequests: 5,
            minSize: 0, // 只要超出0字节就生成一个新包
          },
        },
      },
    },
    devServer: {
      contentBase: path.resolve(__dirname, "./dist"),
      port: 8080,
      compress: true,
      hot: true,
      open: true,
      host: "192.168.1.5",
      historyApiFallback: true, // 该选项的作用所有的404都连接到index.html
      proxy: {
        // 代理到后端的服务地址，会拦截所有以api开头的请求地址
        "/timg": "https://timgsa.baidu.com",
      },
    },
  };
};
