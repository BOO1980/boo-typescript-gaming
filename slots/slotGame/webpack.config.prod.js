const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
//const CopyWebpackPlugin = require("copy-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");

// var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const DefinePlugin = require("webpack/lib/DefinePlugin");
//const ImageminPlugin = require("imagemin-webpack-plugin").default;

let iosBuild = false;
let resolution = 0;
let appBuildInfo = "";
let tweakerAllowed = false;

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
  productionBuild: true,
  devBuild: false,
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
//   },
//   {
//     from: "honeypot",
//     to: "honeypot",
//     ignore: [".DS_Store"],
//   },
//   {
//     from: "./config.json",
//     to: "./config.json",
//     ignore: [".DS_Store"],
//   },
//   {
//     from: "game",
//     to: "game",
//     ignore: [".DS_Store"],
//   },
//   {
//     from: "./version.js",
//     to: "./version.js",
//     ignore: [".DS_Store"],
//   },
//   {
//     from: "./CHANGELOG.md",
//     to: "./CHANGELOG.md",
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
//   // cacheFolder: path.resolve(`./.optiCache/${speed}`), // use existing folder called cache in the current dir
// });

// console.log(`imageMin disabled = ${iosBuild}`);

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
//   // cacheFolder: path.resolve(`./.optiCache/ios/${speed}`), // use existing folder called cache in the current dir
// });

//.console.log(`imageMinIOSBuild disabled = ${!iosBuild}`);

// https://www.npmjs.com/package/zip-webpack-plugin

const zipPlugin = new ZipPlugin({
  // OPTIONAL: defaults to the Webpack output path (above)
  // can be relative (to Webpack output path) or absolute
  // path: '/', // example "/zip"

  // OPTIONAL: defaults to the Webpack output filename (above) or,
  // if not present, the basename of the path
  // filename: gameConfig.game.gameShortName +"_"+ gameConfig.game.version+'_bundle.zip',
  filename: "bundle.zip",

  // OPTIONAL: defaults to 'zip'
  // the file extension to use instead of 'zip'
  // extension: 'ext',

  // OPTIONAL: defaults to the empty string
  // the prefix for the files included in the zip file
  // pathPrefix: 'relative/path',

  // OPTIONAL: defaults to the identity function
  // a function mapping asset paths to new
  /*
    pathMapper: function(assetPath) {
      // put all pngs in an `images` subdir
      if (assetPath.endsWith('.png'))
        return path.join(path.dirname(assetPath), 'images', path.basename(assetPath));
      return assetPath;
    }, */

  // OPTIONAL: defaults to including everything
  // can be a string, a RegExp, or an array of strings and RegExps
  // include: [/\.js$/],

  // OPTIONAL: defaults to excluding nothing
  // can be a string, a RegExp, or an array of strings and RegExps
  // if a file matches both include and exclude, exclude takes precedence
  exclude: [/\.DS_Store$/, /\.psd$/], //  [/\.png$/, /\.html$/]

  /*
    // yazl Options
    // OPTIONAL: see https://github.com/thejoshwolfe/yazl#addfilerealpath-metadatapath-options
    fileOptions: {
      mtime: new Date(),
      mode: 0o100664,
      compress: true,
      forceZip64Format: false,
    },

    // OPTIONAL: see https://github.com/thejoshwolfe/yazl#endoptions-finalsizecallback
    zipOptions: {
      forceZip64Format: false,
    }, */
});

module.exports = {
  mode: "production",
  stats: {
    colors: false,
    hash: true,
    timings: true,
    assets: true,
    chunks: true,
    chunkModules: true,
    modules: true,
    children: true,
  },

  entry: {
    game: "./src/index.js",
  },

  optimization: {
    runtimeChunk: "single",
    splitChunks: {
      chunks: "all",
    },
    minimizer: [
      new UglifyJsPlugin({
        chunkFilter: (chunk) => {
          // Exclude uglification for the `vendor` chunk
          if (chunk.name === "vendor") {
            return false;
          }

          return true;
        },
        sourceMap: true,
        uglifyOptions: {
          compress: {
            inline: false,
            // remove warnings
            // warnings: false,
            // remove console.logs
            // drop_console: true,
          },
          output: {
            comments: false, // use it for removing comments like "/*! ... */"
          },
        },
      }),
    ],
  },
  output: {
    filename: "[name].bundle.js",
    chunkFilename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/, /honeypot/],
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
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
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/,
        exclude: /node_modules/,
        use: ["file-loader?name=[name].[ext]"], // ?name=[name].[ext] is only necessary to preserve the original file name
      },
    ],
  },
  plugins: [
    definePlugin,
    htmlPlugin,
    //copyStaticPlugin,
    // imageMin,
    // imageMinIOSBuild,
    // providePlugin,
    // new BundleAnalyzerPlugin({ analyzerPort: 8889 }),
  ],
};
