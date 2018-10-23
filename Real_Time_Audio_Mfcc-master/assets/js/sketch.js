//NOTICE: Click-Play Audio button before click Start (Analyser)
// setup init variables
var defaultMfcc = [0,0,0,0,0,0,0,0,0,0,0,0,0]
var mfcc = defaultMfcc
var rms = 0
var featureType = 'mfcc'
var listening = false
var featureType2 = 'rms'
var threshold = 0.002 // threshold on rms value
var mfccThreshold = 0.1 // threshold on mffc feature values
var silence = true

// draw init variables
var magnify = 100
var data = []
var rectWidth = 25
var rectHeight = 20
var maxDataLength = 60



function setup() {
    // initialisations
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    var context = new AudioContext()
    var source = null
    var startButton = null
    var stopButton = null
        
    // canvas setup
    createCanvas(rectWidth*maxDataLength, rectHeight*mfcc.length)
    background(255, 230, 150)


    // get microphone
    navigator.getUserMedia({audio:true, video:false},function(){
        // get audio stream data
       // source = context.createMediaStreamSource(stream)
        const htmlAudioElement = document.getElementById("audio");
        const source = context.createMediaElementSource(htmlAudioElement);
        
        source.connect(context.destination);

        // analyser setup
        meydaAnalyzer = Meyda.createMeydaAnalyzer({
            'audioContext':context,
            'source':source,
            'bufferSize':512,
            'featureExtractors':[featureType, featureType2],
            'callback':show
        })

        // buttons
        startButton = createButton('Start')
        startButton.mousePressed(function(){
            // start audio analyzer
            if(listening == false){
                meydaAnalyzer.start([featureType, featureType2])
                listening = true
                startButton.html('Stop')
                startButton.style('background:#aa0')
            }else{
                meydaAnalyzer.stop()
                listening = false
                startButton.html('Start')
                startButton.style('background:#aaf')
            }
        })

    },function(error){
        console.log(error)
    })
}
//dataN is an array of array of each mfcc (13 coefficients)-the meyda algorithm calculated 44100 Hz/512 buffer=86 mfcc/second
var dataN = [];
function show(features){
    // update spectral data size
    mfcc = features[featureType]
    rms = features[featureType2]

    dataN.push(mfcc);
    console.log(mfcc)
//normalized the mfcc data    
dataN2=[];
for (var i=0;i<dataN.length;i++) {
var dataN1=[];
for (var j=0;j<dataN[0].length;j++) {
dataN1.push((dataN[i][j]-math.mean(dataN[i]))/math.norm(dataN[i][j]-math.mean(dataN[i])));
}
dataN2.push(dataN1);
}

//calculate the self-similarity matrix by calculating the dot product of every mfcc value at specific time i and time j
var out=[];
for (var i=0; i<dataN2.length;i++) {

var outterm=[]; 
for (var j=0;j<dataN2.length;j++) {
outterm.push((math.dot(dataN2[i],dataN2[j])/math.norm(dataN2[i]))/math.norm(dataN2[j]))
}
out.push(outterm);
}


//create the image generating data from Self-Similarity Matrix
//first row of the image is the similarity of mfcc at time (i) with the whole audio
//each pixel has 4 value defining the color, each pixel contains the value of similarity equation
var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");
//dataN2.length is the width and height of the image.
var imgData = ctx.createImageData(dataN2.length, dataN2.length);
console.log(imgData);

for (var i = 0;i<out.length;i++){
    for (var j = 0;j<out[i].length;j++){
   var pos =(i*out[i].length + j)*4;
     imgData.data[pos +0] = 0;
     imgData.data[pos+1] = 0;
     imgData.data[pos+2] = 0;
     imgData.data[pos+3] = out[i][j]*100;
    }
}
console.log(imgData.data);
ctx.putImageData(imgData, 0, 0);



}

function check(x){
    return mfcc[x] > mfccThreshold
}

function draw(){
    clear()
    background(255, 230, 150)

    // if valid sound frame recieved add to data
    if(rms>threshold){
        data.push(mfcc)
        silence = false
    }else{
        if(silence == false){
            data.push(defaultMfcc)
            silence = true
        }
    }
    if(data.length>maxDataLength){
        data.splice(0,1)
    }

    // print data
    for(i=0;i<data.length;i++){
        for(j=0;j<data[i].length;j++){
            var value = data[i][j]*magnify
            if(data[i][j]>=0){
                fill(0,value,0)
            }else{
                fill(0,0,-value)
            }
            rect(i*rectWidth, j*rectHeight, rectWidth, rectHeight)
        }
    }



}
