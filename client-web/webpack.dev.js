const webpack = require("webpack");
const merge = require("webpack-merge");
const path = require("path");

const info = {
  TITLE: 'Proof Tester (Development)'
}

const config = {
  mode: "development",
  devtool: "source-map",

  plugins: [
    new webpack.DefinePlugin({
      "__DEBUG__": "true"
    }),
  ]
};

const common = require("./webpack.common.js")(info);

module.exports = [
  merge(common.main, config),
];
