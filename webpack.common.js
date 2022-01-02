const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const base = info => {
  return {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: {
              experimentalWatchApi: true,
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
      ]
    },

    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries
    externals: {
      "react": "React",
      "react-dom": "ReactDOM"
    },
  }
};

const main = info => {
  return {
    entry: {
      main: "./src/index.tsx"
    },

    output: {
      filename: "[name].bundle.[chunkhash].js",
      chunkFilename: "[name].bundle.[chunkhash].js",
      path: path.join(__dirname, "dist")
    },

    plugins: [
      new ProgressBarPlugin({width: 80}),

      new CleanWebpackPlugin(),
      new CopyWebpackPlugin(["src/icons/favicon.ico"]),
      new CopyWebpackPlugin(["node_modules/react/umd/react.production.min.js"]),
      new CopyWebpackPlugin(["node_modules/react-dom/umd/react-dom.production.min.js"]),

      new MiniCssExtractPlugin({
        filename: "[name].[chunkhash].css",
        chunkFilename: "[name].[chunnkhash].css"
      }),

      new HtmlWebpackPlugin({
        flename: 'index.html',
        title: info.TITLE,
        chunks: [ 'main' ],
        template: './src/index.html'
      })
    ],
  }
}

module.exports = info => {
  return { main: Object.assign(base(info), main(info)) };
};
