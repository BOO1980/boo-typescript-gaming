const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ProvidePlugin = require("webpack/lib/ProvidePlugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");

const uiName = "default";
const buildNonObfuscated = true;

// var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');

const providePlugin = new ProvidePlugin({
  // $: "jquery",
  // jQuery: "jquery",
  PIXI: "pixi.js",
  // "PIXI.spine": "pixi-spine",
  // "window.jQuery": "jquery",
  // "window.PIXI": "pixi.js",
});

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

const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

// The below webpack plugin will copy the dist folder to the target folder in the options as shown below
// target - can be set to "" - by default if the copy action is not required

module.exports = (env) => {
  // copy paths
  // console.log(`UI To Include:${process.argv[4].substring(2)}`);

  // const uiName = process.argv[4].substring(2);
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
      ignore: [".DS_Store", "*.bak"],
      // context: '/',
    },
    {
      from: soundSource,
      to: soundTarget,
      ignore: [".DS_Store", "*.bak"],
      // context: '/',
    },
    {
      from: fontSource,
      to: fontTarget,
      ignore: [".DS_Store", "*.bak"],
      // context: '/',
    },
    {
      from: uiConfigSource,
      to: uiConfigTarget,
      ignore: [".DS_Store", "*.bak"],
      // context: '/',
    },
    {
      from: localeConfigSource,
      to: localeConfigTarget,
      ignore: [".DS_Store", "*.bak"],
      // context: '/',
    },
    {
      from: base64Source,
      to: base64Target,
      ignore: [".DS_Store", "*.bak"],
      // context: '/',
    },
  ]);

  return {
    resolve: {
      modules: ["node_modules", path.resolve(__dirname, "honeypot/src")],
    },
    mode: "production",
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
    optimization: {
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
      // new BundleAnalyzerPlugin()
    ],
  };
};
