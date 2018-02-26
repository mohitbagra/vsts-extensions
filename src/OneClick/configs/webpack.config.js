const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "OneClick/scripts/SettingsApp": "./src/OneClick/scripts/Components/Settings/SettingsApp.tsx",
        "OneClick/scripts/RuleEditor": "./src/OneClick/scripts/Components/Settings/RuleEditor.tsx",
        "OneClick/scripts/WorkItemRulesGroup": "./src/OneClick/scripts/Components/FormGroup/WorkItemRulesGroup.tsx",
        "OneClick/scripts/ActionRenderers": "./src/OneClick/scripts/Components/ActionRenderers/index.ts"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin(
            {
                name: "oneclick_common_chunks",
                chunks: ["OneClick/scripts/SettingsApp", "OneClick/scripts/RuleEditor", "OneClick/scripts/ActionRenderers"],
                filename: "./OneClick/scripts/oneclick_common_chunks.js",
                minChunks: 2
            }
        ),
        new CopyWebpackPlugin([
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "OneClick/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "OneClick/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "OneClick/3rdParty/fabric.min.css" },
            { from: "./node_modules/trumbowyg/dist/ui/icons.svg", to: "OneClick/3rdParty/icons.png" },
            
            { from: "./src/Library/ES5-Polyfills", to: "OneClick/Polyfills" },

            { from: "./src/OneClick/configs", to: "OneClick/configs" },
            { from: "./src/OneClick/images", to: "OneClick/images" },
            { from: "./src/OneClick/html", to: "OneClick/html" },
            { from: "./src/OneClick/vss-extension.json", to: "OneClick/vss-extension.json" },
            { from: "./src/OneClick/README.md", to: "OneClick/README.md" }
        ])
    ]
}

module.exports = config;