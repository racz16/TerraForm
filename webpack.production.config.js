//@ts-check
'use strict';

const path = require('path');
const webpack = require('webpack');  

/**@type {import('webpack').Configuration}*/
module.exports = {
    mode: 'production',
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
                use: [
                    {
                        loader: path.resolve('loaders/wgsl-loader.js'),
                    },
                ],
            },
            {
                test: /\.(vert|frag|glsl)$/,
                type: 'asset/source',
                use: [
                    {
                        loader: path.resolve('loaders/glsl-loader.js'),
                    },
                ],
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            DEVELOPMENT: JSON.stringify(false),
            PRODUCTION: JSON.stringify(true),
        }),
    ],
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname),
    },
    resolve: {
        extensions: ['.ts'],
    },
};
