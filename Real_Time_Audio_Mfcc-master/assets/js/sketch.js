// setup init variables
var defaultMfcc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
var mfcc = defaultMfcc;
var rms = 0
var featureType = 'mfcc'
var featureType2 = 'rms'
var listening = false
var threshold = 0.001 // threshold on rms value
//var mfccThreshold = 0.1 // threshold on mffc feature values
var silence = true
// draw init variables
var data = [];
var rectWidth = 25
var rectHeight = 20
var maxDataLength = 60
var count = -1;
var count1 = -1;
var startButton = null;
dataeval = [];
comparedata = [];
comparedata1 = [];

function setup() {
    noLoop();
    // initialisations
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    var context = new AudioContext()
    var source = null


    // canvas setup
    createCanvas(rectWidth * maxDataLength, rectHeight * mfcc.length)
    background(255, 230, 150)


    // get microphone
    navigator.getUserMedia({audio: true, video: false}, function () {
        // get audio stream data
        // source = context.createMediaStreamSource(stream)
        const htmlAudioElement = document.getElementById("audio");
        const source = context.createMediaElementSource(htmlAudioElement);
        source.connect(context.destination);


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
        startButton = createButton('Start')
        startButton.mousePressed(function () {
            // start audio analyzer
            if (listening == false) {
                meydaAnalyzer.start([featureType, featureType2])
                htmlAudioElement.play()
                Listening = true
                startButton.html('Stop')
                startButton.style('background:#aa0')
                loop();
                ++count;
                console.log('1 ne')
            } else {
                meydaAnalyzer.stop()
                listening = false
                startButton.html('Start')
                startButton.style('background:#aaf')

            }

        })

    }, function (error) {
        console.log(error)
    })

}

//origin_data is an array of array of each mfcc (13 coefficients)-the meyda algorithm calculated 44100 Hz/512 buffer=86 mfcc/second

origin_data = [];

function show(features) {
    // update spectral data size

    mfcc = features[featureType] //features["mfcc"]
    rms = features[featureType2]
    if (rms != 0) {
        origin_data.push(mfcc);
    }

    if (origin_data.length > 0 && ((origin_data.length % 100) == 0)) {
        meydaAnalyzer.stop();
        noLoop();
        startButton.html('Start')
        startButton.style('background:#aaf')
        dataprocess();
        score(crossimilarity);
        console.log('2 ne')

        // if (count1 == 1) {
        //     for (var i = 0; i < matrix1[0].length; i++) {
        //         for (var j = 0; j < matrix1[0].length; j++) {
        //             comparedata.push(math.norm(math.subtract(matrix1[i], matrix2[j]), 'fro'))
        //
        //         }
        //         comparedata1.push(comparedata);
        //     }
        //
        // }
    }
}

function draw() {
    clear()
    background(255, 230, 150)

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

    console.log('drawchart')
    // print data
    for (i = 0; i < data.length; i++) {
        for (j = 0; j < data[i].length; j++) {
            var value = data[i][j] * 10
            if (data[i][j] >= 0) {
                fill(0, value, 0)
            } else {
                fill(0, 0, -value)
            }
            rect(i * rectWidth, j * rectHeight, rectWidth, rectHeight)
        }
    }
}

function dataprocess() {
    // data normalization
    normalized_data = [];
    for (var i = 0; i < origin_data.length; i++) {
        var data1 = [];
        var average = math.mean(origin_data[i]);
        for (var j = 0; j < origin_data[0].length; j++) {
            data1.push((origin_data[i][j] - average) / math.norm(origin_data[i][j] - average));
        }
        normalized_data.push(data1);
    }

    //calculate cos between two mfcc vector->create self similarity matrix
    self_similarity_data = [];

    for (var i = 0; i < normalized_data.length; i++) {
        data2 = [];
        matrix1 = [];
        matrix2 = [];
        for (var j = 0; j < normalized_data.length; j++) {
            data2.push((math.dot(normalized_data[i], normalized_data[j]) / 20))
        }
        self_similarity_data.push(data2);
        dataeval.push(data2);
        matrix1 = dataeval.slice(0, 50);
        matrix2 = dataeval.slice(50, 100);
    }


    color_data = [];
    for (var i = 0; i < self_similarity_data.length; i++) {
        data3 = [];
        for (var j = 0; j < self_similarity_data[0].length; j++) {
            data3.push(d3.rgb(d3.hsl(self_similarity_data[i][j] * 257, 1, 0.5)));
        }
        color_data.push(data3);
    }
    console.log('mau day')

    function euclideanDistance(a, b) {
        sum = 0;
        for (var i = 0; i < a.length; i++) {

            sum += math.pow(a[i] - b[i], 2)
        }
        return math.sqrt(sum)
    }

    function displayssm() {
        ssmcompare = [];
        for (var i = 0; i < crossscore.length; i++) {
            ssmcompare.push(math.min(crossscore[i]))

        }
        document.getElementById("demo").innerHTML = (math.median(ssmcompare));
    }

    function drawmatrix() {
        var k = color_data.length;
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        var imgData = ctx.createImageData(color_data.length, color_data.length);
        //  console.log(imgData);

        for (var i = 0; i < k; i++) {
            for (var j = 0; j < k; j++) {
                var pos = (i * k + j) * 4;
                imgData.data[pos + 0] = color_data[i][j].r;
                imgData.data[pos + 1] = color_data[i][j].g;
                imgData.data[pos + 2] = color_data[i][j].b;
                imgData.data[pos + 3] = 255;
            }
        }
        //console.log(imgData.data);
        //where to draw the whole image
        ctx.putImageData(imgData, count * 150, 0);
    }

    function sortrow(a) {
        // a = a.slice();
//sort the row of coss similarity matrix then take the k*row.length point
        rowsort = [];
        for (var i = 0; i < a.length; i++) {
            rowsort.push(a[i].sort(function (a, b) {
                return a - b;
            }))
        }
        rowsortmin = [];
        for (var i = 0; i < rowsort.length; i++) {
            rowsortmin.push(rowsort[i][10])
        }
    }

    function sortcol(a) {
        // a = a.slice();
//sort the column
        column = [];
        column = _.unzip(a)
        sortcolumn = [];
        for (var i = 0; i < column.length; i++) {
            sortcolumn.push(column[i].sort(function (a, b) {
                return a - b;
            }))
        }
        sortcolumnmin = [];
        for (var i = 0; i < sortcolumn.length; i++) {
            sortcolumnmin.push(sortcolumn[i][10])
        }
    }

    //Create Cross similarity Matrix from 2 SSM data
    crossimilarity = [];
    crossscore = [];
    cross1 = [];
    cross2 = [];
    for (var i = 0; i < matrix1.length; i++) {
        CSM = [];
        for (var j = 0; j < matrix2.length; j++) {
            CSM.push(euclideanDistance(matrix1[i], matrix2[j]))

        }
        crossimilarity.push(CSM.slice());
        crossscore.push(CSM.slice())
        cross1.push(CSM.slice());
        cross2.push(CSM.slice());
    }


//draw binary matrix
    function drawbinarymatrix() {
        for (var i = 0; i < crossimilarity.length; i++) {
            minrowcol = math.min(rowsortmin[i], sortcolumnmin[i])
            for (var j = 0; j < crossimilarity[0].length; j++) {
                if (crossimilarity[i][j] < minrowcol) {
                    crossimilarity[i][j] = 1;
                } else {
                    crossimilarity[i][j] = 0;
                }
            }
        }
        console.log('im')

        var k = crossimilarity.length;
        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        var imgData = ctx.createImageData(crossimilarity.length, crossimilarity[0].length);
        //  console.log(imgData);

        for (var i = 0; i < k; i++) {
            for (var j = 0; j < k; j++) {
                var pos = (i * k + j) * 4;
                imgData.data[pos + 0] = 0;
                imgData.data[pos + 1] = 0;
                imgData.data[pos + 2] = 0;
                imgData.data[pos + 3] = crossimilarity[i][j] * 255;
            }
        }
        console.log(imgData.data);
        //where to draw the whole image
        ctx.putImageData(imgData, count * 150, 300);

    }


    drawmatrix(color_data);
    origin_data = [];
    sortrow(cross1);
    sortcol(cross2);
    drawbinarymatrix(crossimilarity)
    displayssm(crossscore);

}
