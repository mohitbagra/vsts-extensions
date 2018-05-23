const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "BugBashPro/scripts/App": "./src/Apps/BugBashPro/scripts/Components/App.tsx",
        "BugBashPro/scripts/AllBugBashesView": "./src/Apps/BugBashPro/scripts/Components/AllBugBashesView.tsx",
        "BugBashPro/scripts/BugBashEditor": "./src/Apps/BugBashPro/scripts/Components/BugBashEditor.tsx",
        "BugBashPro/scripts/BugBashResults": "./src/Apps/BugBashPro/scripts/Components/BugBashResults.tsx",
        "BugBashPro/scripts/BugBashDetails": "./src/Apps/BugBashPro/scripts/Components/BugBashDetails.tsx",
        "BugBashPro/scripts/BugBashCharts": "./src/Apps/BugBashPro/scripts/Components/BugBashCharts.tsx",
        "BugBashPro/scripts/SettingsPanel": "./src/Apps/BugBashPro/scripts/Components/SettingsPanel.tsx",
        "BugBashPro/scripts/FileUploadDialog": "./src/Common/Components/FileUploadDialog/FileUploadDialog.tsx"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin(
            {
                name: "bugbashpro_common_chunks",
                chunks: [
                    "BugBashPro/scripts/App",
                    "BugBashPro/scripts/AllBugBashesView",
                    "BugBashPro/scripts/BugBashEditor",                    
                    "BugBashPro/scripts/BugBashResults",
                    "BugBashPro/scripts/BugBashDetails",
                    "BugBashPro/scripts/BugBashCharts",
                    "BugBashPro/scripts/SettingsPanel",
                    "BugBashPro/scripts/FileUploadDialog"
                ],
                filename: "./BugBashPro/scripts/bugbashpro_common_chunks.js",
                minChunks: 3
            }
        ),
        new CopyWebpackPlugin([
            { from: "./node_modules/react/umd/react.production.min.js", to: "BugBashPro/3rdParty/react.js" },
            { from: "./node_modules/react-dom/umd/react-dom.production.min.js", to: "BugBashPro/3rdParty/react-dom.js" },

            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "BugBashPro/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "BugBashPro/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "BugBashPro/3rdParty/fabric.min.css" },
            
            { from: "./src/Apps/BugBashPro/configs", to: "BugBashPro/configs" },
            { from: "./src/Apps/BugBashPro/images", to: "BugBashPro/images" },
            { from: "./src/Apps/BugBashPro/html", to: "BugBashPro/html" },
            { from: "./src/Apps/BugBashPro/vss-extension.json", to: "BugBashPro/vss-extension.json" },
            { from: "./src/Apps/BugBashPro/README.md", to: "BugBashPro/README.md" }
        ])
    ]
}

module.exports = config;