const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // installed via npm
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ProvidePlugin = require("webpack/lib/ProvidePlugin");

const DistCopyPlugin = require("./DistCopyWebpackPlugin.js");

const uiName = "default";

console.log(`Params****************:${process.argv[3]}`);

// var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

const providePlugin = new ProvidePlugin({
  // $: "jquery",
  // jQuery: "jquery",
  PIXI: "pixi.js",
  // "PIXI.spine": "pixi-spine",
  // "window.jQuery": "jquery",
  // "window.PIXI": "pixi.js",
});

const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

// The below webpack plugin will copy the dist folder to the target folder in the options as shown below
// target - can be set to "" - by default if the copy action is not required

const distCopyPlugin = new DistCopyPlugin({
  // target: "../roulette/honeypot",
  // target: "../secretsofamunra/honeypot",
  // target: "../mooseymoney/honeypot",
  // target: "../cliffhanger/honeypot",
  // target: "../bigriverfishing/honeypot",
  // target: "../kingkaching/honeypot",
  // target: "../ballyroulette/honeypot",
  // target: "../fantasyfalls/honeypot",
  // target: "../saber/honeypot",
  target: "../handsomebandit/honeypot",
});

module.exports = (env) => {
  // copy paths
  console.log(`UI To Include:${process.argv[4].substring(2)}`);

  const uiName = process.argv[4].substring(2);
  const imageSource = `honeypot/src/ui/${uiName}/images`;
  const imageTarget = `ui/${uiName}/images`;

  const soundSource = `honeypot/src/ui/${uiName}/sounds`;
  const soundTarget = `ui/${uiName}/sounds`;

  const fontSource = `honeypot/src/ui/${uiName}/fonts`;
  const fontTarget = `ui/${uiName}/fonts`;

  const uiConfigSource = `honeypot/src/ui/${uiName}/uiConfig.js`;
  const uiConfigTarget = `ui/${uiName}/uiConfig.js`;

  const localeConfigSource = "honeypot/src/locales";
  const localeConfigTarget = "locales";

  const base64Source = "honeypot/src/base64";
  const base64Target = "base64";

  const copyStaticPlugin = new CopyWebpackPlugin([
    {
      from: imageSource,
      to: imageTarget,
      ignore: [".DS_Store"],
      // context: '/',
    },
    {
      from: soundSource,
      to: soundTarget,
      ignore: [".DS_Store"],
      // context: '/',
    },
    {
      from: fontSource,
      to: fontTarget,
      ignore: [".DS_Store"],
      // context: '/',
    },
    {
      from: uiConfigSource,
      to: uiConfigTarget,
      ignore: [".DS_Store"],
      // context: '/',
    },
    {
      from: localeConfigSource,
      to: localeConfigTarget,
      ignore: [".DS_Store"],
      // context: '/',
    },
    {
      from: base64Source,
      to: base64Target,
      ignore: [".DS_Store"],
      // context: '/',
    },
  ]);

  return {
    resolve: {
      modules: ["node_modules", path.resolve(__dirname, "honeypot/src")],
    },
    mode: "development",
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      moduleAssets: false,
      chunks: true,
      chunkModules: true,
      chunkOrigins: true,
      env: true,
      children: true,

      // logging: true,
    },
    devServer: {
      contentBase: path.resolve(__dirname, "dist"),
      liveReload: true, // gameConfig.devServer.liveReload,
      writeToDisk: true,
      compress: false,
      noInfo: false,
      port: 9090, // gameConfig.devServer.port,
      onListening(server) {
        const { port } = server.listeningApp.address();
        console.log("Webpack dev-server Listening on port:", port);
      },
    },
    devtool: "source-map",
    entry: "./honeypot/src/index.js",

    output: {
      // filename: 'game.js',
      filename: "honeypot.js",
      // chunkFilename: "[name].bundle.js",
      path: path.resolve(__dirname, "dist"),
      // path: "D:\\Repos\\brightlightcity\\honeypot",
      // path: "D:\\Repos\\HoneyPotV2Split\\honeypot",
      libraryTarget: "umd",
      library: "HoneyPot",
    },
    // optimization: {
    //     splitChunks: {
    //         chunks: "all",
    //     },
    // },
    module: {
      rules: [
        {
          test: /\.(m4a|png|svg|jpg|jpeg|gif|ico|gif|eot|woff|ttf)$/,
          loader: "ignore-loader",
        },
        {
          test: /\.js$|jsx/,
          exclude: [/node_modules/],
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
              // presets:["@babel/preset-es2015"]
            },
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
      new CleanWebpackPlugin(),
      copyStaticPlugin,
      providePlugin,
      new BundleAnalyzerPlugin(),
      distCopyPlugin,
    ],
  };
};
