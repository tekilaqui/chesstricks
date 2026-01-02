const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/client/modules/index.js',
    output: {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '' // Relative to HTML
    },
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(mp3|wav)$/i,
                type: 'asset/resource',
            }
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './index.html',
            filename: 'index.html',
            inject: 'body',
            minify: {
                removeComments: true,
                collapseWhitespace: true
            }
        }),
        new MiniCssExtractPlugin({
            filename: 'style.[contenthash].css',
        }),
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "logo.jpg", to: "logo.jpg" },
                { from: "stockfish.js", to: "stockfish.js" },
                // { from: "sw.js", to: "sw.js" } // If separate
            ],
        }),
    ],
    devServer: {
        static: './dist',
        hot: true,
    },
};
