const path = require("path");

const HtmlWebPackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const DefinePlugin = require("webpack/lib/DefinePlugin");

let iosBuild = false;
let resolution = 0;
let appBuildInfo = "";
let tweakerAllowed = true;

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

const copyStaticPlugin = new CopyWebpackPlugin([
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
]);

module.exports = {
  mode: "development",
  watch: true,
  watchOptions: {
    ignored: /node_modules/,
  },
  devtool: "source-map",

  entry: {
    game: "./src/index.js",
  },
  plugins: [htmlPlugin],
};
