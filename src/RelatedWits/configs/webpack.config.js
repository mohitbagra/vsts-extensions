const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "RelatedWits/scripts/App": "./src/RelatedWits/scripts/Components/App.tsx",
        "RelatedWits/scripts/SettingsPanel": "./src/RelatedWits/scripts/Components/SettingsPanel.tsx"
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "RelatedWits/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "RelatedWits/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "RelatedWits/3rdParty/fabric.min.css" },
            
            { from: "./src/RelatedWits/configs", to: "RelatedWits/configs" },
            { from: "./src/RelatedWits/images", to: "RelatedWits/images" },
            { from: "./src/RelatedWits/html", to: "RelatedWits/html" },
            { from: "./src/RelatedWits/vss-extension.json", to: "RelatedWits/vss-extension.json" },
            { from: "./src/RelatedWits/README.md", to: "RelatedWits/README.md" }
        ])
    ]
}

module.exports = config;