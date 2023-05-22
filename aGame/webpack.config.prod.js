const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const DefinePlugin = require("webpack/lib/DefinePlugin");


const htmlPlugin = new HtmlWebPackPlugin({
    template: "index.html",
    hash: true,
    filename: "./index.html",
    random: `${Date.now()}`,
});



module.exports = {
    mode: "production",

    entry: {
        game: "./src/index.js",
    },

    output: {
        filename: "[name].bundle.js",
        chunkFilename: "[name].bundle.js",
        path: path.resolve(__dirname, "dist"),
    },

    module: {

    },
    plugins: [
        htmlPlugin
    ],
};
