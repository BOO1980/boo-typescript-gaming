const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// const ProvidePlugin = require("webpack/lib/ProvidePlugin");
// const DefinePlugin = require("webpack/lib/DefinePlugin");
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
// const DistCopyPlugin = require("./DistCopyWebpackPlugin");

// The below webpack plugin will copy the dist folder to the target folder in the options as shown below
// target - can be set to "" - by default if the copy action is not required

// we need to copy all ui types over, not just one
// its the client build which should clean up e.g. remove the ui folder not required
// const patterns = [];
// const uiTypes = ["common", "default", "slotmasters"];
// for (let i = 0; i < uiTypes.length; i++) {
//     patterns.push({
//         from: `honeypot/src/ui/${uiTypes[i]}/images`,
//         to: `ui/${uiTypes[i]}/images`,
//         globOptions: {
//             ignore: ["**/.DS_Store", "**/*.txt", "**/*.bak"],
//         },
//     });
//     patterns.push({
//         from: `honeypot/src/ui/${uiTypes[i]}/sounds`,
//         to: `ui/${uiTypes[i]}/sounds`,
//         globOptions: {
//             ignore: ["**/.DS_Store", "**/*.txt", "**/*.bak"],
//         },
//     });
//     patterns.push({
//         from: `honeypot/src/ui/${uiTypes[i]}/fonts`,
//         to: `ui/${uiTypes[i]}/fonts`,
//         globOptions: {
//             ignore: ["**/.DS_Store", "**/*.txt", "**/*.bak"],
//         },
//     });
//     patterns.push({
//         from: `honeypot/src/ui/${uiTypes[i]}/base64`,
//         to: `ui/${uiTypes[i]}/base64`,
//         globOptions: {
//             ignore: ["**/.DS_Store", "**/*.txt", "**/*.bak"],
//         },
//     });
//     patterns.push({
//         from: `honeypot/src/ui/${uiTypes[i]}/locales`,
//         to: `ui/${uiTypes[i]}/locales`,
//         globOptions: {
//             ignore: ["**/.DS_Store", "**/*.txt", "**/*.bak"],
//         },
//     });
//     patterns.push({
//         from: `honeypot/src/ui/${uiTypes[i]}/uiConfig.js`,
//         to: `ui/${uiTypes[i]}/uiConfig.js`,
//         globOptions: {
//             ignore: ["**/.DS_Store", "**/*.txt", "**/*.bak"],
//         },
//     });
// }

// patterns.push({
//     from: "honeypot/src/locales",
//     to: "locales",
//     globOptions: {
//         ignore: ["**/.DS_Store", "**/*.txt", "**/*.bak"],
//     },
// });

module.exports = {
  resolve: {
    modules: ["node_modules", path.resolve(__dirname, "boofw/src")],
  },
  mode: "development",
  entry: {
    main: path.resolve(__dirname, "./boofw/src/index.js"),
  },
  // devServer: {
  //     static: path.resolve(__dirname, "./dist"),
  //     hot: false,
  //     liveReload: true,
  //     devMiddleware: {
  //         writeToDisk: true,
  //     },
  //     port: 9090,
  // },
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "boofw.js",
    clean: true,
    libraryTarget: "umd",
    library: "BooFW",
  },
  // module: {
  //     rules: [
  //         {
  //             test: /\.js$|jsx/,
  //             exclude: [/node_modules/],
  //             use: {
  //                 loader: "babel-loader",
  //                 options: {
  //                     "presets": ["@babel/preset-env", "airbnb"],
  //                     "plugins": ["@babel/plugin-proposal-class-properties"],
  //                 },
  //             },
  //         },
  //     ],
  // },
  // plugins: [
  //     new DefinePlugin({
  //         PROD_BUILD: JSON.stringify(false),
  //         DEV_BUILD: JSON.stringify(true),
  //     }),
  //     new CopyWebpackPlugin({
  //         patterns: patterns,
  //     }),
  //     new ProvidePlugin({
  //         PIXI: "pixi.js",
  //     }),
  //     new BundleAnalyzerPlugin({
  //         defaultSizes: "stat",
  //     }),
  //     new DistCopyPlugin({
  //         // target: "../roulette/honeypot",
  //         // target: "../secretsofamunra/honeypot",
  //         // target: "../mooseymoney/honeypot",
  //         // target: "../cliffhanger/honeypot",
  //         // target: "../bigriverfishing/honeypot",
  //         // target: "../kingkaching/honeypot",
  //         // target: "../ballyroulette/honeypot",
  //         // target: "../fantasyfalls/honeypot",
  //         // target: "../saber/honeypot",
  //         // target: "../hyperbars/honeypot",
  //         // target: "../slotmastersv2client/honeypot",
  //         // target: "../SM_Ladbrokes_Slot_Rivals/honeypot",
  //         // target: "../SM_BigRiverFishing/honeypot",
  //         // target: "../SM_Ladbrokes_Cheltenham/honeypot",
  //         // target: "../SM_CashInTheKeep/honeypot",
  //         target: "../SM_Fanzone/honeypot",
  //     }),
  // ],
};
