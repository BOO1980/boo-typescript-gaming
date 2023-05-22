const path = require("path");

const HtmlWebPackPlugin = require("html-webpack-plugin");

const htmlPlugin = new HtmlWebPackPlugin({
    template: "index.html",
    hash: true,
    filename: "./index.html",
    random: `${Date.now()}`,
});

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
    plugins: [
        htmlPlugin
    ]
};