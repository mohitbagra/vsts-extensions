const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "OneClick/scripts/SettingsApp": "./src/Apps/OneClick/scripts/Components/Settings/SettingsApp.tsx",
        "OneClick/scripts/RuleEditor": "./src/Apps/OneClick/scripts/Components/Settings/RuleEditor.tsx",
        "OneClick/scripts/WorkItemRulesGroup": "./src/Apps/OneClick/scripts/Components/FormGroup/WorkItemRulesGroup.tsx",
        "OneClick/scripts/ActionRenderers": "./src/Apps/OneClick/scripts/Components/ActionRenderers/index.ts"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: "oneclick_common_chunks",
            chunks: ["OneClick/scripts/SettingsApp", "OneClick/scripts/RuleEditor", "OneClick/scripts/ActionRenderers"],
            filename: "./OneClick/scripts/oneclick_common_chunks.js",
            minChunks: 2
        }),
        new CopyWebpackPlugin([
            { from: "./node_modules/react/umd/react.production.min.js", to: "OneClick/3rdParty/react.js" },
            { from: "./node_modules/react-dom/umd/react-dom.production.min.js", to: "OneClick/3rdParty/react-dom.js" },

            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "OneClick/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "OneClick/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "OneClick/3rdParty/fabric.min.css" },

            { from: "./src/Common/ES5-Polyfills", to: "OneClick/Polyfills" },

            { from: "./src/Apps/OneClick/configs", to: "OneClick/configs" },
            { from: "./src/Apps/OneClick/images", to: "OneClick/images" },
            { from: "./src/Apps/OneClick/html", to: "OneClick/html" },
            { from: "./src/Apps/OneClick/vss-extension.json", to: "OneClick/vss-extension.json" },
            { from: "./src/Apps/OneClick/README.md", to: "OneClick/README.md" }
        ])
    ]
};

module.exports = config;
