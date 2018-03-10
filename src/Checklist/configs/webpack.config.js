const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "Checklist/scripts/App": "./src/Checklist/scripts/Components/App.tsx",
        "Checklist/scripts/ChecklistView": "./src/Checklist/scripts/Components/ChecklistView.tsx",
        "Checklist/scripts/SettingsApp": "./src/Checklist/scripts/Components/Settings/SettingsApp.tsx",
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin(
            {
                name: "checklist_common_chunks",
                chunks: ["Checklist/scripts/App", "Checklist/scripts/ChecklistView"],
                filename: "./Checklist/scripts/checklist_common_chunks.js",
                minChunks: 2
            }
        ),
        new CopyWebpackPlugin([
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "Checklist/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "Checklist/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "Checklist/3rdParty/fabric.min.css" },
            
            { from: "./src/Library/ES5-Polyfills", to: "Checklist/Polyfills" },

            { from: "./src/Checklist/configs", to: "Checklist/configs" },
            { from: "./src/Checklist/images", to: "Checklist/images" },
            { from: "./src/Checklist/html", to: "Checklist/html" },
            { from: "./src/Checklist/vss-extension.json", to: "Checklist/vss-extension.json" },
            { from: "./src/Checklist/README.md", to: "Checklist/README.md" }
        ])
    ]
}

module.exports = config;