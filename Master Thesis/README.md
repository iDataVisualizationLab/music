
# Real-time Sound Visualization and Classification
**(put screen image here)**
## Main Features:
The project focus mainly on the following issue:
* What is it in an audio sample that makes it "sound similar"?
* How similar sound visualized in 2d plot using tsne method?
* Applying Neural Network to Train and Predict the sound data.
* Recording and visualzing sound sample in real-time.

### Prerequisites
The project will cover some knowledge related sound analysis, mfcc coefficients, self-similarity matrix, t-SNE method, minimum spanning tree and basic neural network.

```
What is mfcc coefficients and Why it is so popular in speech recognition field?
```
- MFCC can actually be seen as a form of dimension reduction. Basically, it represents for a rate change in energy level of different frequency band in a short window sound signal's frame. In this project, the window frame is about 92.8 ms. **(put mfcc image here)**
```
Why MFCC is used popularly in automatic speech recognition (ASR) system?
```
- Humans are much better at discerning small changes in pitch at low frequencies than they are at high frequencies. We do not hear loudness on a linear scale. Generally to double the perceived volume of a sound we need to put 8 times as much energy into it.
With mel scale using in MFCC, our features are more close the human auditory system's response more closely than the linearly-spaced frequency bands used in the normal cepstrum. **(put mfcc image here)**
### Dataset

-  Music notes: [https://philharmonia.co.uk/resources/sound-samples/](https://philharmonia.co.uk/resources/sound-samples/) recorded by Philharmonia musicians. It includes all standard orchestral instruments, as well as guitar, mandolin, banjo, and a vast array of different percussion instruments.
- Human Speech: [https://philharmonia.co.uk/resources/sound-samples/](https://philharmonia.co.uk/resources/sound-samples/) daily human speech including noise.

## Demo

### Feature Extractions
- 13 MFCC coefficients are extracted for each window
- Mean for each dimension of the feature is calculated. Size : 13 
- The standard deviation of each dimension in the feature was computed. Size: 13
- Finally, we calculated the mean first order difference between the successive feature frames. This told us how much on average the features changed over time. Size: 13
- Concatenating the above features we got a single feature vector length 39.

### How well t-SNE output can be used to visualize the cluster?
#### Lower window size can help getting better result in cluster. 

### How different feature selections change the visualization?

### Does it mean that samples lying far away from the others is dissimilarity? 
**(use minimum spanning tree)**
### Self-Similarity Matrix does reflect identical shape of different sound samples
### Training the data and classifying with neural network

### Real-time audio recording and visualization
####  Experiment:

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc

