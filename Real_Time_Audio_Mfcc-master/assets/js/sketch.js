// setup init variables
var defaultMfcc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
var mfcc = defaultMfcc;
var rms = 0;
// var mfcc2 = defaultMfcc;
// var rms2 = 0;
var featureType = 'mfcc'
var featureType2 = 'rms'
var Listening = false
var threshold = 0.00001 // threshold on rms value
//var mfccThreshold = 0.1 // threshold on mffc feature values
var silence = true
// draw init variables
var data = [];
var rectWidth = 25
var rectHeight = 20
var maxDataLength = 40
var count = 0;
var startButton = null;
var matrix1 = [];
var matrix2 = [];
var matrix11 = [];
var matrix22 = [];
var matrixx1 = [];
var origin_data1 = [];
var origin_data2 = [];
var comparescore = 0;
var finalscore = 0
var url1 = './assets/risu.wav';
var url2 = './assets/koto.wav';
var audioCtx = new AudioContext();


function setup() {
    createCanvas(rectWidth * maxDataLength, rectHeight * defaultMfcc.length)
    background(255, 230, 150)
    getData(url1)

}

function getData(a) {

    // var audioCtx = new AudioContext();
    var offlineCtx = new OfflineAudioContext(2, 44100 * 10, 44100);
    var source = offlineCtx.createBufferSource()
    //use XMLHttpRequest to load audio tract
    var request = new XMLHttpRequest();
    request.open('GET', a, true);
    request.responseType = 'arraybuffer';
    //return the audio data to audioData variable type arraybuffer
    request.onload = function () {

        audioData = request.response;
        //decode the audio data from array buffer and stored to AudioBufferSourceNode
        offlineCtx.decodeAudioData(audioData, function (buffer) {
            // myBuffer = buffer;
            source.buffer = buffer;
            source.connect(offlineCtx.destination);
            source.start();
            playsound1(buffer);

            meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
                'audioContext': offlineCtx,
                'source': source,
                'melBands': 26,
                'sampleRate': 44100,
                'bufferSize': 2048,
                'featureExtractors': [featureType, featureType2],
                'callback': show1

            })


            //source.loop = true;
            offlineCtx.startRendering()
            offlineCtx.oncomplete = function (e) {
                matrix1 = origin_data1
                matrix11 = predata(matrix1)
                drawmatrix(matrix11)
                ++count
                getData2(url2)
                console.log(e.renderedBuffer)
                //source.stop()
                console.log(audioData)
                console.log(source)
                // audioData=null;
                // source=null;
                // e.renderedBuffer contains the output buffer
            }
            meydaAnalyzer1.start()

        });
    }

    request.send();
    //meydaAnalyzer1.stop()
    console.log('2')
}


function getData2(a) {
    var offlineCtx2 = new OfflineAudioContext(2, 44100 * 10, 44100);
    var source2 = offlineCtx2.createBufferSource()
    // origin_data=[]
    // source = offlineCtx.createBufferSource();

    //use XMLHttpRequest to load audio tract
    var request2 = new XMLHttpRequest();
    request2.open('GET', a, true);
    request2.responseType = 'arraybuffer';
    //return the audio data to audioData variable type arraybuffer
    request2.onload = function () {

        audioData2 = request2.response;
        //decode the audio data from array buffer and stored to AudioBufferSourceNode
        offlineCtx2.decodeAudioData(audioData2, function (buffer) {
            // myBuffer = buffer;
            source2.buffer = buffer;
            //source.connect(offlineCtx.destination);
            source2.start();
            playsound2(buffer)

            meydaAnalyzer2 = Meyda.createMeydaAnalyzer({
                'audioContext': offlineCtx2,
                'source': source2,
                'melBands': 26,
                'sampleRate': 44100,
                'bufferSize': 2048,
                'featureExtractors': [featureType, featureType2],
                'callback': show2

            })


            //source.loop = true;
            offlineCtx2.startRendering()
            offlineCtx2.oncomplete = function (e) {
                matrix2 = origin_data2
                matrix22 = predata(matrix2)
                drawmatrix(matrix22)
                comparescore = dataprocess(matrix11, matrix11);
                console.log(comparescore)
                finalscore = dataprocess(matrix11, matrix22);
                console.log(finalscore)
                document.getElementById("smith").innerHTML = "SmithWaterman Score: " + 100 * finalscore / comparescore;

                console.log(e.renderedBuffer)
                source2.stop()
                console.log(audioData2)
                console.log(source2)
                // audioData=null;
                // source=null;
                // e.renderedBuffer contains the output buffer
            }


            meydaAnalyzer2.start()


        });
    }

    request2.send();
    console.log('2')
}

function playsound1(buffer) {
    var song = audioCtx.createBufferSource();
    song.buffer = buffer;
    song.connect(audioCtx.destination);
    song.start(0)
}

function playsound2(buffer) {
    var song2 = audioCtx.createBufferSource();
    song2.buffer = buffer;
    song2.connect(audioCtx.destination);
    song2.start(0)
}

function show1(features) {
    // update spectral data size


    mfcc = features[featureType] //features["mfcc"]
    rms = features[featureType2]
    if (rms > threshold) {
        origin_data1.push(mfcc)
        console.log(origin_data1)
    }
}

function show2(features) {
    // update spectral data size
    mfcc = features[featureType] //features["mfcc"]
    rms = features[featureType2]
    if (rms > threshold) {
        origin_data2.push(mfcc)
        console.log(origin_data2)
    }
}

function drawmatrix(a) {

    color_data = [];
    for (var i = 0; i < a.length; i++) {
        data3 = [];
        for (var j = 0; j < a[0].length; j++) {
            data3.push(d3.rgb(d3.hsl(a[i][j] * 257, 1, 0.5)));
        }
        color_data.push(data3);
    }
    var k = color_data.length;
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    var imgData = ctx.createImageData(color_data[0].length, color_data.length);
    console.log(imgData);

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
    ctx.putImageData(imgData, count * (math.max(matrix2.length, matrix1.length) + 20), 0);
}

function predata(a) {
    // data normalization
    normalized_data = [];
    for (var i = 0; i < a.length; i++) {
        var data1 = [];
        var average = math.mean(a[i]);
        for (var j = 0; j < a[0].length; j++) {
            data1.push((a[i][j] - average) / math.norm(a[i][j] - average));
        }
        normalized_data.push(data1);
    }

    //calculate cos between two mfcc vector->create self similarity matrix
    self_similarity_data = [];

    for (var i = 0; i < normalized_data.length; i++) {
        data2 = [];
        for (var j = 0; j < normalized_data.length; j++) {
            data2.push((math.dot(normalized_data[i], normalized_data[j]) / 20))
        }
        self_similarity_data.push(data2);
    }

    return self_similarity_data
    console.log('2')
}


function dataprocess(a, b) {
    crossscore = [];
    crossimilarity = [];
    for (var i = 0; i < a.length; i++) {
        CSM = [];
        for (var j = 0; j < b.length; j++) {
            CSM.push(euclideanDistance(a[i], b[j]))
        }
        crossimilarity.push(CSM.slice());
        crossscore.push(CSM.slice())
    }

    function displayssm() {
        ssmcompare = [];
        for (var i = 0; i < crossimilarity.length; i++) {
            ssmcompare.push(math.min(crossimilarity[i]))

        }
        return document.getElementById("demo").innerHTML = "Euclidean Score: " + (math.median(ssmcompare));
    }

    function euclideanDistance(a, b) {
        sum = 0;
        if (a.length == b.length) {
            for (var i = 0; i < a.length; i++) {
                sum += math.pow(a[i] - b[i], 2)
            }
        } else if (a.length < b.length) {
            a = a.concat(Array(b.length - a.length).fill(0))
            for (var i = 0; i < b.length; i++) {

                sum += math.pow(a[i] - b[i], 2)

            }
        } else {
            b = b.concat(Array(a.length - b.length).fill(0))
            for (var i = 0; i < a.length; i++) {

                sum += math.pow(a[i] - b[i], 2)
            }
        }


        return math.sqrt(sum)
    }


//Create Cross similarity Matrix from 2 SSM data
    function sortrow(a) {
//sort the row of cross similarity matrix then take the k*row.length point
        rowsort = [];
        for (var i = 0; i < a.length; i++) {
            rowsort.push(a[i].sort(function (a, b) {
                return a - b;
            }))
        }
        rowsortmin = [];
        number = 0;
        number = math.round(a.length * 0.1)

        for (var i = 0; i < rowsort.length; i++) {
            rowsortmin.push(rowsort[i][number])
        }
    }


    function sortcol(a) {
//sort the column
        column = [];
        column = _.unzip(a)
        sortcolumn = [];
        for (var i = 0; i < column.length; i++) {
            sortcolumn.push(column[i].sort(function (a, b) {
                return a - b;
            }))
        }
        number = 0;
        number = math.round(a[0].length * 0.1)

        sortcolumnmin = [];
        for (var i = 0; i < sortcolumn.length; i++) {
            sortcolumnmin.push(sortcolumn[i][number])
        }
    }

//draw binary matrix
    function drawbinarymatrix() {
        for (var i = 0; i < crossimilarity.length; i++) {
            for (var j = 0; j < crossimilarity[0].length; j++) {
                if (crossimilarity[i][j] < math.min(rowsortmin[i], sortcolumnmin[j])) {
                    crossimilarity[i][j] = 0;
                } else {
                    crossimilarity[i][j] = 1;
                }
            }
        }


        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        var imgData = ctx.createImageData(crossimilarity[0].length, crossimilarity.length);
        //  console.log(imgData);

        for (var i = 0; i < crossimilarity.length; i++) {
            for (var j = 0; j < crossimilarity[0].length; j++) {
                var pos = (i * crossimilarity[0].length + j) * 4;
                imgData.data[pos + 0] = 0;
                imgData.data[pos + 1] = 0;
                imgData.data[pos + 2] = 0;
                imgData.data[pos + 3] = crossimilarity[i][j] * 255;
            }
        }
        console.log(imgData.data);
        //where to draw the whole image
        ctx.putImageData(imgData, count * (math.max(matrix2.length, matrix1.length) + 20), 300);

    }

    function Delta(a, b) {
        gapOpening = -0.5;
        gapExtension = -0.7;
        if (b > 0) {
            return 0;
        } else if (b == 0 && a > 0) {
            return gapOpening;
        } else {
            return gapExtension;
        }
    }

    function Match(i) {
        matchScore = 1;
        mismatchScore = -1;

        if (i == 1) {
            return mismatchScore
        } else {
            return matchScore
        }
    }

    function score() {
// N = crossimilarity.length[0]+1
// M = crossimilarity.length[1]+1
//math.zeros(math.size(A))
        arr = Array(crossimilarity.length + 1).fill(Array(crossimilarity[0].length + 1));
        D = math.zeros(math.size(arr))
        maxD = 0;
        for (i = 3; i < D.length; i++) {
            for (j = 3; j < D[0].length; j++) {
                MS = Match(crossimilarity[i - 1][j - 1])
//H_(i-1, j-1) + S_(i-1, j-1) + delta(S_(i-2,j-2), S_(i-1, j-1))
                d1 = D[i - 1][j - 1] + MS + Delta(crossimilarity[i - 2][j - 2], crossimilarity[i - 1][j - 1])
//H_(i-2, j-1) + S_(i-1, j-1) + delta(S_(i-3, j-2), S_(i-1, j-1))
                d2 = D[i - 2][j - 1] + MS + Delta(crossimilarity[i - 3][j - 2], crossimilarity[i - 1][j - 1])
//H_(i-1, j-2) + S_(i-1, j-1) + delta(S_(i-2, j-3), S_(i-1, j-1))
                d3 = D[i - 1][j - 2] + MS + Delta(crossimilarity[i - 2][j - 3], crossimilarity[i - 1][j - 1])
                D[i][j] = math.max(d1, d2, d3, 0)
            }

        }

        return math.max(D);

    }


//origin_data = [];
    displayssm()
    sortrow(crossscore);
    sortcol(crossscore);
    drawbinarymatrix(crossimilarity);

    return score()

}


function draw() {
    clear()
    background(255, 230, 150)
    // if(count=0){

    // }

    // if valid sound frame recieved add to data
    if (rms > threshold) {
        data.push(mfcc)
        silence = false

    } else {
        if (silence == false) {
            data.push(defaultMfcc)
            silence = true
            console.log(count)

        }

    }

    if (data.length > maxDataLength) {
        data.splice(0, 1)
    }

    //console.log('drawchart')
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

