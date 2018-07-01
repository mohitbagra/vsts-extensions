const path = require("path");
const webpack = require("webpack");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { existsSync } = require("fs");
const Apps = require("./src/Apps");

let appEntryPoints = {};
let appPlugins = [
    new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify("production")
    }),
    new UglifyJSPlugin({
        uglifyOptions: {
            compress: {
                warnings: false,
                ie8: true,
                conditionals: true,
                unused: true,
                comparisons: true,
                sequences: true,
                dead_code: true,
                evaluate: true,
                if_return: true,
                join_vars: true
            },
            output: {
                comments: false,
                beautify: false
            },
            warnings: false
        }
    })
];

Apps.forEach(appName => {
    const appPath = path.resolve(__dirname, `src/Apps/${appName}`);
    if (existsSync(appPath)) {
        console.log(`App "${appName}" found.`);
        const configPath = path.resolve(__dirname, `src/Apps/${appName}/configs/webpack.config.js`);
        if (existsSync(configPath)) {
            const config = require(configPath);
            if (config.entry) {
                appEntryPoints = { ...appEntryPoints, ...config.entry };
            }
            if (config.plugins) {
                appPlugins = appPlugins.concat(config.plugins);
            }
        } else {
            console.log(`No config found for App "${appName}".`);
        }
    } else {
        console.log(`App "${appName}" not found.`);
    }
});

module.exports = {
    target: "web",
    entry: appEntryPoints,
    output: {
        filename: "[name].js",
        libraryTarget: "amd"
    },
    externals: [
        {
            q: true,
            react: true,
            "react-dom": true
        },
        /^VSS\/.*/,
        /^TFS\/.*/,
        /^q$/
    ],
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        moduleExtensions: ["-loader"],
        alias: {
            OfficeFabric: path.resolve(__dirname, "node_modules/office-ui-fabric-react/lib"),
            VSSUI: path.resolve(__dirname, "node_modules/vss-ui"),
            Common: path.resolve(__dirname, "src/Common"),
            BugBashPro: path.resolve(__dirname, "src/Apps/BugBashPro/scripts"),
            Checklist: path.resolve(__dirname, "src/Apps/Checklist/scripts"),
            ControlsLibrary: path.resolve(__dirname, "src/Apps/ControlsLibrary/scripts"),
            OneClick: path.resolve(__dirname, "src/Apps/OneClick/scripts"),
            PRWorkItems: path.resolve(__dirname, "src/Apps/PRWorkItems/scripts"),
            RelatedWits: path.resolve(__dirname, "src/Apps/RelatedWits/scripts")
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader"
            },
            {
                test: /\.s?css$/,
                use: [
                    { loader: "style-loader" },
                    { loader: "css-loader" },
                    { loader: "sass-loader" },
                    {
                        loader: "sass-resources-loader",
                        query: {
                            resources: [path.resolve(__dirname, "./src/Common/_CommonStyles.scss")]
                        }
                    }
                ]
            }
        ]
    },
    plugins: appPlugins
};
