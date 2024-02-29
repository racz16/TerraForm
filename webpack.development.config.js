//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');

/**@type {import('webpack').Configuration}*/
module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                include: [path.resolve(__dirname, 'src')],
            },
            {
                test: /\.wgsl$/,
                type: 'asset/source',
            },
            {
                test: /\.(vert|frag|glsl)$/,
                type: 'asset/source',
            },
        ],
    },
    output: {
        filename: 'index.js',
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    plugins: [
        new webpack.DefinePlugin({
            DEVELOPMENT: JSON.stringify(true),
            PRODUCTION: JSON.stringify(false),
        }),
    ],
    devtool: 'cheap-module-source-map',
    devServer: {
        static: {
            directory: __dirname,
        },
    },
};
