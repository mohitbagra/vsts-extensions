This repo holds all my VSTS extensions. 

* Bug Bash Pro
* Checklist
* Controls Library
* One Click
* Related WITs
* PR WorkItems

There is also a common library for shared components and utils in "Library" folder.

Steps to run build and package. From root folder -
* Run "npm install" 
* Run "npm run build" to generate build in a "dist" folder at root level
* Run "npm run package" to generate build and also packaged vsix files for extensions.

"src/Apps.js" file manages all the apps that build and package command look into. If you want to build and package just 1 extension, comment all other into Apps.js file.

**If you want to fork just one of the extensions from it in your own account, do the following -**

1. Fork the repo
2. Decide which extension do you want. Lets say you want "Checklist" extension.
3. Go to "src" folder and delete all folders except "Checklist" and "Library". "Library" holds a set of common components/utilities that every extension of mine uses, so you need this folder.
4. In Apps.js file, remove everything except "Checklist"
5. In tsconfig file, edit "paths" property. Remove all except "Checklist", "Library", "VSSUI", and "OfficeFabric". 
6. In webpack.config.js file, edit "alias". Remove all except "Checklist", "Library", "VSSUI", and "OfficeFabric". 

And you are all set. Run "npm run package" to build and package your extension and "npm start" to start a local dev server

