const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "RelatedWits/scripts/App": "./src/Apps/RelatedWits/scripts/Components/App.tsx",
        "RelatedWits/scripts/SettingsPanel": "./src/Apps/RelatedWits/scripts/Components/SettingsPanel.tsx"
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: "./node_modules/react/umd/react.production.min.js", to: "RelatedWits/3rdParty/react.js" },
            { from: "./node_modules/react-dom/umd/react-dom.production.min.js", to: "RelatedWits/3rdParty/react-dom.js" },
            
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "RelatedWits/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "RelatedWits/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "RelatedWits/3rdParty/fabric.min.css" },
            
            { from: "./src/Apps/RelatedWits/configs", to: "RelatedWits/configs" },
            { from: "./src/Apps/RelatedWits/images", to: "RelatedWits/images" },
            { from: "./src/Apps/RelatedWits/html", to: "RelatedWits/html" },
            { from: "./src/Apps/RelatedWits/vss-extension.json", to: "RelatedWits/vss-extension.json" },
            { from: "./src/Apps/RelatedWits/README.md", to: "RelatedWits/README.md" }
        ])
    ]
}

module.exports = config;