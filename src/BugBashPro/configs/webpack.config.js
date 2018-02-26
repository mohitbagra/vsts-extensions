const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "BugBashPro/scripts/App": "./src/BugBashPro/scripts/Components/App.tsx",
        "BugBashPro/scripts/AllBugBashesView": "./src/BugBashPro/scripts/Components/AllBugBashesView.tsx",
        "BugBashPro/scripts/BugBashEditor": "./src/BugBashPro/scripts/Components/BugBashEditor.tsx",
        "BugBashPro/scripts/BugBashResults": "./src/BugBashPro/scripts/Components/BugBashResults.tsx",
        "BugBashPro/scripts/BugBashCharts": "./src/BugBashPro/scripts/Components/BugBashCharts.tsx",
        "BugBashPro/scripts/SettingsPanel": "./src/BugBashPro/scripts/Components/SettingsPanel.tsx"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin(
            {
                name: "bugbashpro_common_chunks",
                chunks: ["BugBashPro/scripts/App", "BugBashPro/scripts/AllBugBashesView", "BugBashPro/scripts/BugBashEditor", "BugBashPro/scripts/BugBashResults", "BugBashPro/scripts/BugBashCharts", "BugBashPro/scripts/BugBashProSettingsPanel"],
                filename: "./BugBashPro/scripts/bugbashpro_common_chunks.js",
                minChunks: 3
            }
        ),
        new CopyWebpackPlugin([
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "BugBashPro/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "BugBashPro/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "BugBashPro/3rdParty/fabric.min.css" },
            { from: "./node_modules/trumbowyg/dist/ui/icons.svg", to: "BugBashPro/3rdParty/icons.png" },
            
            { from: "./src/BugBashPro/configs", to: "BugBashPro/configs" },
            { from: "./src/BugBashPro/images", to: "BugBashPro/images" },
            { from: "./src/BugBashPro/html", to: "BugBashPro/html" },
            { from: "./src/BugBashPro/vss-extension.json", to: "BugBashPro/vss-extension.json" },
            { from: "./src/BugBashPro/README.md", to: "BugBashPro/README.md" }
        ])
    ]
}

module.exports = config;