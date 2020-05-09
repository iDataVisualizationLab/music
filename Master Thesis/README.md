
# Real-time Sound Visualization and Classification
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/Realtime-tsne.gif)
## Demo:
https://idatavisualizationlab.github.io/music/Master%20Thesis/
## Main Features:
The project focus mainly on the following issue:
* What is it in an audio sample that makes it "sound similar"?
* How similar sound visualized in 2d plot using tsne method?
* Applying Neural Network to Train and Classify the sound data.
* Recording and visualzing sound sample in real-time.
## Visualization Methods:
In the project, we apply the following visualization approaches:
- Real-time heatmap which display the mfcc coefficient in time series.
- Euclidean distance which shows the distance trend from one sound sample to another.
<img src="https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/heatmap.png" height="300">

- Radar Chart which shows the comparison between two similar sounds. Each sound represented by a vector of 39 values which will be described later. 
- Scatter plot shows the output of t-SNE

### Prerequisites
The project will cover some knowledge related sound analysis, mfcc coefficients, self-similarity matrix, t-SNE method, minimum spanning tree and basic neural network.

```
What is mfcc coefficients and Why it is so popular in speech recognition field?
```
- MFCC can actually be seen as a form of dimension reduction. Basically, it represents for a rate change in energy level of different frequency band in a short window sound signal's frame. In this project, the window frame is about 92.8 ms. 
- <img src="https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/mfcc.png" height = 300>
```
Why MFCC is used popularly in automatic speech recognition (ASR) system?
```
- Humans are much better at discerning small changes in pitch at low frequencies than they are at high frequencies. We do not hear loudness on a linear scale. Generally to double the perceived volume of a sound we need to put 8 times as much energy into it.
With mel scale using in MFCC, our features are more close the human auditory system's response more closely than the linearly-spaced frequency bands used in the normal cepstrum. 
<img src="https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/Melscale.png" height = 300>

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
#### t-SNE (-distributed Stochastic Neighbor Embedding), high dimensionality reduction algorithm
- t-SNE is not a linear projection. By utilizing the local relationships between points in high dimension to create a low-dimensional mapping. As the result, t-SNE can capture non-linear structure.
-  There is no clear line between which points are neighbors of the other points. This lack of clear borders can be a major advantage because it allows t-SNE to naturally take both global and local structure into account. 
- - In the project, after doing many testing, I set t-SNE 's perplexity equal to 20 and for the real-time visualization purpose, t-SNE is calculated every time it gets new data sample, therefore, the sub-iteration is set to 100 and final iteration after collecting all the data is 1000.  
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
### Does it mean that samples lying far away from the others is dissimilar? 
- The below figure will show that why we can not rely on the t-SNE output in 2D to tell that "samples which are far away from each other in 2D space are dissimilar".
- Both oboe and bass drum clusters are showed that they stay away from another subset in the 2D space, however, they are actually similar to each other.
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/mst.png)
### Self-Similarity Matrix does reflect identical shape of different sound samples
In case that, t-SNE output can not generate a good cluster. We might want to focus on the self-similarity matrix image of each sound sample.
- Music is generally self-similar. Generally, structure and repetition is a general feature of nearly all music. Self Similarity Matrix reveals the relationship between each segment of a track to all the other segments in the same recording. In this project, we computed all pairwise-similarity of each time step using cosine similarity giving domain from 0 to 1. Finally, we get a nxn square SSM represented for each sound sample. 
- Dark blue means the sample is the mostly matched with itself. Red means the two comparative sample are totally different

![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/ssm.gif)

### Training the data and classifying with neural network
#### Can we train a neural network on web browser? 
- The answer is definitely "yes". Great thanks to ml5.js library, we can collect data to train our own neural network or use existing data to train neural network in real-time to do classification task.
- In the project, we apply a model of feed-forward neural network with 16 hidden units, 3 layers, sigmoid as activation function and learning setting to 0.25 as default. The model learning paradigm is supervised learning which uses a set of paired inputs and desired outputs. Users have option to customize the neural network parameter like learning rate, epoch.
#### Experiment 1: Music Notes Data
-  Number of sound samples: 194
-  Epoch: 400
-  Output units: 15 sound labels
-  Result: error rate is down to 0.4. This value is still considered fairly high. However, let's look at the classification task below to see how well the model was trained. The result will show the label and confidence value of the selected sample.
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/train1.gif)
#### Experiment 2: Human Speech Data
- Number of sound samples: 228
- Epoch: 400
- Output units: 7 labels including: zero, dog, down, bed, bird, six, stop
- Result: error rate is 0.2.
We can see that the model can classify really much better than the clusters were formed by t-SNE output
![alt text](https://github.com/iDataVisualizationLab/music/blob/master/Master%20Thesis/image/train_speech.gif)
### Real-time audio recording and visualization
####  Experiment: Human Speech
- Record audio using Web Audio API
- The first 20 sound samples will say by me
- The rest 20 samples will say by my wife
- I assume that the t-SNE output will show two clear cluster for each person.

#### Experiment: Violin versus Guitar


## Future Work:
- t-SNE output can only use for visualization purpose. It can show some cluster and preserve the global as well as local relationship of the sample. However, we can not rely on the t-SNE output in 2D for classification or evaluation later since it changes every time we run the algorithm
-The neural network shows some possible result in classify the sample, however, we still need to implement the model validation method to enhance the result.
- I want to work further in developing the application so that the user can record their song or playing a song in real-time, then the application can re-generate the similar song by using the current sound data sample or it can connect to soundcloud or spotify to find the similar song.






