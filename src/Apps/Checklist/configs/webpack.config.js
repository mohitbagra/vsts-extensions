const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "Checklist/scripts/App": "./src/Apps/Checklist/scripts/Components/App.tsx",
        "Checklist/scripts/ChecklistView": "./src/Apps/Checklist/scripts/Components/ChecklistView.tsx",
        "Checklist/scripts/SettingsApp": "./src/Apps/Checklist/scripts/Components/Settings/SettingsApp.tsx",
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
            { from: "./node_modules/react/umd/react.production.min.js", to: "Checklist/3rdParty/react.js" },
            { from: "./node_modules/react-dom/umd/react-dom.production.min.js", to: "Checklist/3rdParty/react-dom.js" },
            
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "Checklist/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "Checklist/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "Checklist/3rdParty/fabric.min.css" },
            
            { from: "./src/Common/ES5-Polyfills", to: "Checklist/Polyfills" },

            { from: "./src/Apps/Checklist/configs", to: "Checklist/configs" },
            { from: "./src/Apps/Checklist/images", to: "Checklist/images" },
            { from: "./src/Apps/Checklist/html", to: "Checklist/html" },
            { from: "./src/Apps/Checklist/vss-extension.json", to: "Checklist/vss-extension.json" },
            { from: "./src/Apps/Checklist/README.md", to: "Checklist/README.md" }
        ])
    ]
}

module.exports = config;