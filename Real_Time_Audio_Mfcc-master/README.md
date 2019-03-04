# Real Time Audio Feature Extraction - Self-Similarity Matrix using MFCC
*Compare two audio file using Euclidean Distance and SmithWaterman Algorithm
*Real Time Audio Mel-frequency cepstral coefficients (MFCC) Analyser in the browser using Javascript [Web Audio API](https://github.com/WebAudio/web-audio-api), [Meyda Audio Feature Extractor](https://github.com/meyda/meyda).



## Setup The Server
* Please Download Zip the project.
* Download and Install [Node.js](https://nodejs.org/en/) and Node Package Manager. 
* Run `npm install` on the command line in the folder for the required dependencies. 
* Then either run the app using 'node server.js'.
* Connect to `localhost:3000` in your favorite browser. 
* I also use Browserify to create a bundle.js files which support loading node module ("require" method) using in client side. 
* There will be a bug when you first run the application (please resume the debug to continue running the application)
* It takes about 4 minutes to run the application since computational cost of 435 distances of 30 sound samples.

## Data
* Collect 30 sample sounds from http://www.philharmonia.co.uk/explore/sound_samples/
* Using Meyda to extract MFCC feature

## Visualization Method
* Using heatmap to display the distance of each comparision pair
![Alt text](https://github.com/iDataVisualizationLab/music/blob/master/Real_Time_Audio_Mfcc-master/image/Heatmap.JPG)
* Draw all the sound sample as each self_similarity_matrix on canvas
![Alt text](https://github.com/iDataVisualizationLab/music/blob/master/Real_Time_Audio_Mfcc-master/image/canvas.JPG)
* Visualize all the sound distance in Network Diagram with Slider
![Alt text](https://github.com/iDataVisualizationLab/music/blob/master/Real_Time_Audio_Mfcc-master/image/network.JPG)
