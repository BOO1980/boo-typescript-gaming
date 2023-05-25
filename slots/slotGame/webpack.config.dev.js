const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
//const CopyWebpackPlugin = require("copy-webpack-plugin");

const DefinePlugin = require("webpack/lib/DefinePlugin");

const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

//const ImageminPlugin = require("imagemin-webpack-plugin").default;

let iosBuild = false;
let resolution = 0;
let appBuildInfo = "";
let tweakerAllowed = true;

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i].indexOf("--tweaker=") !== -1) {
    tweakerAllowed = process.argv[i] === "--tweaker=true";
    break;
  }
}

for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i].indexOf("--iosBuild=") !== -1) {
    iosBuild = process.argv[i] === "--iosBuild=true";
    break;
  }
}
if (iosBuild === true) {
  console.log("******** Starting IOS Build");
  resolution = 1;
  appBuildInfo = "A1";
}

const gameInitData = {
  forceResolutionRequired: iosBuild === true,
  forceResolution: resolution,
  isIOSAppBuild: iosBuild,
  iosAppBuildVersion: appBuildInfo,
  tweakerAllowed: tweakerAllowed,
  productionBuild: false,
  devBuild: true,
};

const definePlugin = new DefinePlugin({
  PROD_BUILD: JSON.stringify(false),
  DEV_BUILD: JSON.stringify(true),
  GAME_INIT_DATA: JSON.stringify(gameInitData),
});

const htmlPlugin = new HtmlWebPackPlugin({
  template: "index.html",
  hash: true,
  filename: "./index.html",
  random: `${Date.now()}`,
});

// const copyStaticPlugin = new CopyWebpackPlugin([
//   {
//     from: "assets",
//     to: "assets/",
//     ignore: [".DS_Store"],
//     // context: '/',
//   },
//   {
//     from: "honeypot",
//     to: "honeypot",
//     ignore: [".DS_Store"],
//     // context: '/',
//   },
//   {
//     from: "game",
//     to: "game",
//     ignore: [".DS_Store"],
//     // context: '/',
//   },
//   {
//     from: "./config.json",
//     to: "./config.json",
//     ignore: [".DS_Store"],
//     // context: '/',
//   },
//   {
//     from: "./version.js",
//     to: "./version.js",
//     ignore: [".DS_Store"],
//     // context: '/',
//   },
// ]);

// const imageMinSpeed = 4;
// const imageMin = new ImageminPlugin({
//   disable: iosBuild,
//   test: ["**/+(*_opt|opt)/*.png"],
//   optipng: null,
//   gifsicle: null,
//   jpegtran: null,
//   svgo: null,
//   pngquant: {
//     speed: imageMinSpeed,
//     quality: "45-70",
//     verbose: false,
//   },
//   maxConcurrency: 4,
//   // dont cache for final build
//   cacheFolder: path.resolve(`./.optiCache/${imageMinSpeed}`), // use existing folder called cache in the current dir
// });

//console.log(`imageMin disabled = ${iosBuild}`);

// const imageMinIOSBuildSpeed = 3;
// const imageMinIOSBuild = new ImageminPlugin({
//   disable: !iosBuild,
//   test: ["**/*.png"],
//   optipng: null,
//   gifsicle: null,
//   jpegtran: null,
//   svgo: null,
//   pngquant: {
//     speed: imageMinIOSBuildSpeed,
//     quality: "40-70",
//     verbose: false,
//   },
//   maxConcurrency: 4,
//   // dont cache for final build
//   cacheFolder: path.resolve(`./.optiCache/ios/${imageMinIOSBuildSpeed}`), // use existing folder called cache in the current dir
// });

//console.log(`imageMinIOSBuild disabled = ${!iosBuild}`);

// const cleanupFilesPlugin = new CleanUpWebpackPlugin({
//   // target: "../roulette/honeypot",
//   iosBuild: iosBuild,
// });

module.exports = {
  mode: "development",
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
  },
  stats: {
    moduleAssets: false,
    chunks: true,
    chunkModules: true,
    chunkOrigins: true,
    env: true,
    colors: true,
    hash: true,
    // logging: true,
  },
  devServer: {
    contentBase: path.resolve(__dirname, "dist"),
    liveReload: true, // gameConfig.devServer.liveReload,
    writeToDisk: false,
    compress: true,
    noInfo: false,
    port: 8111, // gameConfig.devServer.port,
    onListening(server) {
      const { port } = server.listeningApp.address();
      console.log("Webpack dev-server Listening on port:", port);
    },
  },
  devtool: "source-map",

  entry: {
    game: "./src/index.js",
  },
  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
    },
  },

  output: {
    filename: "[name].bundle.js",
    chunkFilename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.(m4a|png|svg|jpg|jpeg|gif|ico|gif|eot|woff|ttf)$/,
        loader: "ignore-loader",
      },
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: {
          loader: "babel-loader",
        },
      },

      {
        test: /\.css$/,
        use: [
          { loader: "style-loader" },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    definePlugin,
    htmlPlugin,
    //copyStaticPlugin,
    // imageMin,
    // imageMinIOSBuild,
    // cleanupFilesPlugin,
    // providePlugin,
    // new BundleAnalyzerPlugin({ analyzerPort: 8889 }),
  ],
};
