
# Real-time Sound Visualization and Classification
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/Realtime-tsne.gif)
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
- MFCC can actually be seen as a form of dimension reduction. Basically, it represents for a rate change in energy level of different frequency band in a short window sound signal's frame. In this project, the window frame is about 92.8 ms. 
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/mfcc.png)
```
Why MFCC is used popularly in automatic speech recognition (ASR) system?
```
- Humans are much better at discerning small changes in pitch at low frequencies than they are at high frequencies. We do not hear loudness on a linear scale. Generally to double the perceived volume of a sound we need to put 8 times as much energy into it.
With mel scale using in MFCC, our features are more close the human auditory system's response more closely than the linearly-spaced frequency bands used in the normal cepstrum. 
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/Melscale.png)
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
#### The interesting finding is that lowering window size does not always help getting better result in the visualization even we collect more data point.
**4096 window size versus 2048 window size for music notes dataset.**
- As shown in the figure below,  we can see clear cluster of oboe, tuba, saxophone, bass drum. Cluster for violin and cello seem not to well separated.![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/4096_music.png)
- With the window size of 2048, the result looks better. All the mentioned cluster gather together well, we also can see a fairly cluster of cello in this case. It's understandable that we could not get a good result for cello and violin since they are all in the same branch string instrument.
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/2048_music.png)
**4096 window size versus 2048 window size for human speech dataset**
- Human speech dataset gave us a clear t-SNE output than the music note dataset. As shown in the figure below, clusters were well formed including dog, bed, zero, down.
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/4096_speech.png)
- However, with 2048 window size, the clusters are not formed really well.
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/2048_speech.png)
- I tested with higher window size, 8192, longer window size mean that we get less feature in one time frame and we assume that the speech signal is static in the long window size comparing with the music note.
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/8192_speech.png)
### How different feature selections change the visualization?
- Now, let's see how the t-SNE output change if we select different features including mean, standard deviation and net value. I took the music notes dataset (window size: 2048) for testing it.
- Mean for each dimension of the feature: 
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/mean_music.gif)
- Standard Deviation for each dimension of the feature: 
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/standardeviation_music.gif)
- Average Net Value of the sample:
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/netvalue_music.gif)
- Obviously, none of the mean, standard deviation or average net value by itself can generate better result than the combination of three of them.
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

