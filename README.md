This repo holds all my VSTS extensions. 

* Bug Bash Pro
* Checklist
* Controls Library
* One Click
* Related WITs

There is also a common library for shared components and utils in "Library" folder.

Steps to run build and package. From root folder -
* Run "npm install" 
* Run "npm run build" to generate build in a "dist" folder at root level
* Run "npm run package" to generate build and also packaged vsix files for extensions.

"src/Apps.js" file manages all the apps that build and package command look into. If you want to build and package just 1 extension, comment all other into Apps.js file.

