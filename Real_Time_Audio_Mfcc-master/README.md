# Real Time Audio Feature Extraction - Self-Similarity Matrix using MFCC

*Real Time Audio Mel-frequency cepstral coefficients (MFCC) Analyser in the browser using Javascript [Web Audio API](https://github.com/WebAudio/web-audio-api), [Meyda Audio Feature Extractor](https://github.com/meyda/meyda) and [P5.js](https://p5js.org/) (for sketching)*


## Setup The Server
* Download and Install [Node.js](https://nodejs.org/en/) and Node Package Manager. 
* Run `npm install` on the command line in the folder for the required dependencies. 
* Then either run the app using `node app.js` or `npm install -g nodemon` and `nodemon app.js`. 
* Connect to `localhost:3000` in your favorite browser. The port may be changed in the app.js file if required.
* The microphone input can be allowed for localhost, but for deployment purposes we need a secured HTTPS connection for allowing the input from the microphone to be passed on to client-side scripts.

## Understanding the visualisations

