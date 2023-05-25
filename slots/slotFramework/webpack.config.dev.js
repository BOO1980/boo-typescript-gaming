const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin"); // installed via npm
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ProvidePlugin = require("webpack/lib/ProvidePlugin");

const uiName = "default";

const providePlugin = new ProvidePlugin({
  PIXI: "pixi.js",
});

const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

// The below webpack plugin will copy the dist folder to the target folder in the options as shown below
// target - can be set to "" - by default if the copy action is not required

module.exports = (env) => {
  return {
    resolve: {
      modules: ["node_modules", path.resolve(__dirname, "slotfw/src")],
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
    entry: "./slotfw/src/index.js",

    output: {
      filename: "slotfw.js",
      path: path.resolve(__dirname, "dist"),
      libraryTarget: "umd",
      library: "SlotFW",
    },
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
      // copyStaticPlugin,
      providePlugin,
      new BundleAnalyzerPlugin(),
      distCopyPlugin,
    ],
  };
};
