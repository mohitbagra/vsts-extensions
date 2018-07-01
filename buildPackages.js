const { execSync } = require("child_process");
const { lstatSync, readdirSync, existsSync } = require("fs");
const { join, resolve } = require("path");
const Apps = require("./src/Apps");

Apps.forEach(appName => {
    const path = resolve(__dirname, `dist/${appName}`);
    if (existsSync(path)) {
        console.log(`App "${appName}" found. Generating vsix package.`);
        execSync(`node ./dist/${appName}/configs/package`);
    } else {
        console.log(`App "${appName}" not found in dist folder.`);
    }
});
