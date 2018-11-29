// setup init variables
var defaultMfcc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
var mfcc = defaultMfcc
var rms = 0
var featureType = 'mfcc'
var listening = false
var featureType2 = 'rms'
var threshold = 0.001 // threshold on rms value
var mfccThreshold = 0.1 // threshold on mffc feature values
var silence = true
var count = 0;
// draw init variables
var magnify = 100
var data = []
var rectWidth = 25
var rectHeight = 20
var maxDataLength = 60
var first = true;


function setup() {

    // initialisations
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    var context = new AudioContext()
    var source = null
    var startButton = null
    var stopButton = null

    // canvas setup
    createCanvas(rectWidth * maxDataLength, rectHeight * mfcc.length)
    background(255, 230, 150)


    // get microphone
    navigator.getUserMedia({audio: true, video: false}, function (stream) {
        // get audio stream data
        source = context.createMediaStreamSource(stream)
        // const htmlAudioElement = document.getElementById("audio");
        // const source = context.createMediaElementSource(htmlAudioElement);
        //
        // source.connect(context.destination);


        // analyser setup
        meydaAnalyzer = Meyda.createMeydaAnalyzer({
            'audioContext': context,
            'source': source,
            'melBands': 26,
            'sampleRate': 44100,
            'bufferSize': 2048,
            'featureExtractors': [featureType, featureType2],
            'callback': show
        })


        // buttons
        //startButton = createButton('Start')
        // startButton.mousePressed(function(){
        // start audio analyzer
        if (listening == false) {


            meydaAnalyzer.start([featureType, featureType2])
            //htmlAudioElement.play()
            listening = true
            // startButton.html('Stop')
            //startButton.style('background:#aa0')


        } else {
            meydaAnalyzer.stop()
            listening = false
            // startButton.html('Start')
            // startButton.style('background:#aaf')

        }

        // })

    }, function (error) {
        console.log(error)
    })
}

//dataN is an array of array of each mfcc (13 coefficients)-the meyda algorithm calculated 44100 Hz/512 buffer=86 mfcc/second

const dataN = [];

function show(features) {
    // update spectral data size
    mfcc = features[featureType] //features["mfcc"]
    rms = features[featureType2]

    dataN.push(mfcc);
}


function draw() {
    clear()
    background(255, 230, 150)
    count += 44.6;

    function msToTime(s) {

        // Pad to 2 or 3 digits, default is 2
        function pad(n, z) {
            z = z || 2;
            return ('00' + n).slice(-z);
        }

        var ms = s % 1000;
        s = (s - ms) / 1000;
        var secs = s % 60;
        s = (s - secs) / 60;
        var mins = s % 60;


        return pad(mins) + ':' + pad(secs) + ':' + pad(ms, 3);

    }


    document.querySelector('.results').innerHTML = msToTime(count);

// Using the jQuery library
    $('.results').html(msToTime(count));


    // if valid sound frame recieved add to data
    if (rms > threshold) {
        data.push(mfcc)
        silence = false

    } else {
        if (silence == false) {
            data.push(defaultMfcc)
            silence = true
        }
    }
    if (data.length > maxDataLength) {
        data.splice(0, 1)
    }


    // print data
    for (i = 0; i < data.length; i++) {
        for (j = 0; j < data[i].length; j++) {
            var value = data[i][j] * 100
            if (data[i][j] >= 0) {
                fill(0, value, 0)
            } else {
                fill(0, 0, -value)
            }
            rect(i * rectWidth, j * rectHeight, rectWidth, rectHeight)
        }
    }


    if (dataN.length >=1500) {
        //document.getElementById('audio').pause()
        noLoop();
        meydaAnalyzer.stop()
        if (first == true) {
            //data normalization
            dataN2 = [];
            for (var i = 0; i < dataN.length; i++) {
                var dataN1 = [];
                var average=math.mean(dataN[i]);
                for (var j = 0; j < dataN[0].length; j++) {
                    dataN1.push((dataN[i][j] - average) / math.norm(dataN[i][j] - average));
                }
                dataN2.push(dataN1);
            }

//calculate cos between two mfcc vector->create self similarity matrix
        var out = [];
        var norms = [];
        for (let i = 0; i < dataN2.length; i++) {
            norms.push(math.norm(dataN2[i]));
        }
        for (var i = 0; i < dataN2.length; i++) {
            var outterm = [];
            for (var j = 0; j < dataN2.length; j++) {
                var datanorm1 = norms[i] * norms[j];
                outterm.push((math.dot(dataN2[i], dataN2[j]) / datanorm1))
            }
            out.push(outterm);
        }

//Scale the value of out to match with color range from [0,1]
            var colorscale = [];
            var linearScale = d3.scaleLinear()
                .domain([0.3, 1])
                .range([0, 0.65]);

            for (var i = 0; i < out.length; i++) {
                var newScaledData = [];

                for (var j = 0; j < out[0].length; j++) {

                    newScaledData.push(linearScale(out[i][j]))
                }
                colorscale.push(newScaledData)
            }


//scale the value of each element in self-similarity matrix [0,1] to RGB color (15s)
            out1 = [];
            for (var i = 0; i < out.length; i++) {
                var out2 = [];
                for (var j = 0; j < out[0].length; j++) {
                    out2.push(d3.interpolateSinebow(colorscale[i][j]))
                }
                out1.push(out2);
            }

//convert RGB value to array of numeric value

            function getRGB(str) {
                var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
                return match ? [
                    match[1],
                    match[2],
                    match[3]
                ] : [];
            }

//out5 is the data of self similarity matrix which contains numeric RGB color value
            out3 = [];
            for (var i = 0; i < out1.length; i++) {
                var out4 = [];
                for (var j = 0; j < out1[0].length; j++) {
                    out4.push(getRGB(out1[i][j]))
                }
                out3.push(out4);
            }
//convert array of string to array of numeric value
            out5 = [];
            for (var i = 0; i < out3.length; i++) {
                var out6 = [];
                for (var j = 0; j < out3[0].length; j++) {
                    out6.push(_.map(out3[i][j], _.ary(parseInt, 1)));
                }
                out5.push(out6);
            }

//draw each pixel corresponding to each rgb value of each element in self-similarity matrix

            var c = document.getElementById("myCanvas");
            var ctx = c.getContext("2d");
            var imgData = ctx.createImageData(out5.length, out5.length);
            console.log(imgData);

            for (var i = 0; i < out5.length; i++) {
                for (var j = 0; j < out5[0].length; j++) {
                    var pos = (i * out[i].length + j) * 4;
                    imgData.data[pos + 0] = out5[i][j][0];
                    imgData.data[pos + 1] = out5[i][j][1];
                    imgData.data[pos + 2] = out5[i][j][2];
                    imgData.data[pos + 3] = 255;
                }
            }
            console.log(imgData.data);
            ctx.putImageData(imgData, 0, 0);

            return first = false;


        }


    }


}


