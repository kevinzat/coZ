const webpack = require("webpack");
const merge = require("webpack-merge");
const path = require("path");

const info = {
  TITLE: 'Proof Tester'
}

const config = {
  mode: "production",

  optimization: {
    minimize: true,
  },

  plugins: [
    new webpack.DefinePlugin({
      "__DEBUG__": "false"
    }),
  ]
};

const common = require("./webpack.common.js")(info);

module.exports = [
  merge(common.main, config),
];
