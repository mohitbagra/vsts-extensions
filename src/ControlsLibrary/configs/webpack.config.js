const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const config = {
    entry: {
        "ControlsLibrary/scripts/MultiValueControl": "./src/ControlsLibrary/scripts/MultiValueControl.tsx",
        "ControlsLibrary/scripts/PatternControl": "./src/ControlsLibrary/scripts/PatternControl.tsx",
        "ControlsLibrary/scripts/PlainTextControl": "./src/ControlsLibrary/scripts/PlainTextControl.tsx",
        "ControlsLibrary/scripts/SliderControl": "./src/ControlsLibrary/scripts/SliderControl.tsx",
        "ControlsLibrary/scripts/RatingControl": "./src/ControlsLibrary/scripts/RatingControl.tsx",
        "ControlsLibrary/scripts/DateTimeControl": "./src/ControlsLibrary/scripts/DateTimeControl.tsx",
    },
    plugins: [
        new CopyWebpackPlugin([
            { from: "./node_modules/react/umd/react.production.min.js", to: "ControlsLibrary/3rdParty/react.js" },
            { from: "./node_modules/react-dom/umd/react-dom.production.min.js", to: "ControlsLibrary/3rdParty/react-dom.js" },
            
            { from: "./node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js", to: "ControlsLibrary/3rdParty/VSS.SDK.min.js" },
            { from: "./node_modules/es6-promise/dist/es6-promise.min.js", to: "ControlsLibrary/3rdParty/es6-promise.min.js" },
            { from: "./node_modules/office-ui-fabric-react/dist/css/fabric.min.css", to: "ControlsLibrary/3rdParty/fabric.min.css" },

            { from: "./src/ControlsLibrary/configs", to: "ControlsLibrary/configs" },
            { from: "./src/ControlsLibrary/images", to: "ControlsLibrary/images" },
            { from: "./src/ControlsLibrary/html", to: "ControlsLibrary/html" },
            { from: "./src/ControlsLibrary/vss-extension.json", to: "ControlsLibrary/vss-extension.json" },
            { from: "./src/ControlsLibrary/README.md", to: "ControlsLibrary/README.md" }
        ])
    ]
}

module.exports = config;