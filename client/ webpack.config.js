const Dotenv = require('dotenv-webpack');

export const plugins = [
    new Dotenv({
        path: "./.env",
        systemvars: true,
        safe: true
    })
];


