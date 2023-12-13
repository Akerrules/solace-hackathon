# Hackathon Boilerplate

This repo contains everything needed to get started hacking in a web browser.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Quickstart

Prerequisites:
- Nodejs 18.x: https://nodejs.org/en/
- Some IDE, VS Code works well for Javascript: https://code.visualstudio.com/

First, run `npm install`. Then this project can be run locally with `npm start`.

Useful resources:
- React tutorial: https://reactjs.org/tutorial/tutorial.html#overview
- SolaceSamples javascript: https://github.com/SolaceSamples/solace-samples-javascript
- solclientjs developer reference: https://docs.solace.com/API-Developer-Online-Ref-Documentation/nodejs/readme.html

## Design
The boilerplate code has a few key components:
1. src/App.js representing the main view
2. src/Client.js wrapping solclientjs for direct messaging providing connect, publish and subscribe functions

To get started hacking, try modifying App.js and using the existing publish and subscribe functions at startup.

## Github Pages

When you push commits to `main` in this repo, they will automatically be deployed on the repo's GitHub Pages page.
Your app can then be accessed by the GitHub Pages URL on any device.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

