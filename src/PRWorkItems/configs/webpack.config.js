const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "PRWorkItems/scripts/App": "./src/PRWorkItems/scripts/App.ts"
    },
    plugins: [        
        new CopyWebpackPlugin([
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "PRWorkItems/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "PRWorkItems/3rdParty/es6-promise.min.js" },
            
            { from: "./src/PRWorkItems/configs", to: "PRWorkItems/configs" },
            { from: "./src/PRWorkItems/images", to: "PRWorkItems/images" },
            { from: "./src/PRWorkItems/html", to: "PRWorkItems/html" },
            { from: "./src/PRWorkItems/vss-extension.json", to: "PRWorkItems/vss-extension.json" },
            { from: "./src/PRWorkItems/README.md", to: "PRWorkItems/README.md" }
        ])
    ]
}

module.exports = config;