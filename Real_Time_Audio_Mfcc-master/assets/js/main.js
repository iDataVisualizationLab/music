// setup init variables
var defaultMfcc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
var mfcc = defaultMfcc;
var rms = 0;
var featureType = 'mfcc'
var featureType2 = 'rms'
var count = 0;
var origin_data1 = [];
var origin_data2 = [];
var url1 = './assets/sound/violind41.mp3'
var url2 = './assets/sound/guitara31.mp3'

function setup() {

    getData(url1)

    function getData(a) {
        //Create audioContext to decode the audio data later
        var audioCtx = new AudioContext();

        //Create source as a buffer source node which contains the audio data after decoding
        var source = audioCtx.createBufferSource()

        //use XMLHttpRequest to load audio tract
        var request = new XMLHttpRequest();

        //Open audio file
        request.open('GET', a, true);

        //The response is a JavaScript ArrayBuffer containing binary data.
        request.responseType = 'arraybuffer';

        //return the audio data to audioData variable type arraybuffer
        request.onload = function () {
            audioData = request.response;

            //decode the audio data from array buffer and stored to AudioBufferSourceNode
            audioCtx.decodeAudioData(audioData, function (buffer) {
                //store data to buffer source node
                source.buffer = buffer;
                //find the duration of the audio in second after decoding
                var duration1 = [];
                duration1.push(source.buffer.duration)

                //create offline audio context to render the decoding audio data then use the offline audio context and another audio buffer source node as inputs to Meyda Analyzer
                var offlineCtx = new OfflineAudioContext(1, 44100 * duration1[0], 44100);

                //create buffer source node which is used in Meyda Analyzer
                var source11 = offlineCtx.createBufferSource()
                //store the audio data to the buffer source node again
                source11.buffer = buffer;

                //connect the source node to offline audio context then go to Meyda Analyzer
                source11.connect(offlineCtx.destination);

                //start the buffer source node
                source11.start();

                //Create Meyda analyzer and set up the parameter
                meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
                    'audioContext': offlineCtx,
                    'source': source11,
                    'melBands': 26,
                    'sampleRate': 44100,
                    'bufferSize': 256,
                    'hopSize': 256,
                    'numberOfMFCCCoefficients': 20,
                    'featureExtractors': [featureType, featureType2],
                    'callback': show1

                })
                //start Meyda Analyzer
                meydaAnalyzer1.start();
                console.log(Meyda.sampleRate)
                //display information of Audio 1 including duration (sec), buffersize, hopsize
                addText("Audio 1 duration (sec): " + math.round(duration1[0] * 10) / 10, 0, 160)
                addText("Audio 1 self_compare_score", 0, 130)
                addText(url1, 0, 100)
                addText("bufferSize: " + Meyda.bufferSize, 0, 70)
                addText("hopSize: " + Meyda.hopSize, 0, 40)

                //Using offline audio context to render audio data
                offlineCtx.startRendering()

                //After complete rendering, performing the following steps
                offlineCtx.oncomplete = function (e) {

                    //copy the data generated from Meyda Analyzer 1
                    var matrix1 = [];

                    //origin_data1 is generated from function show1 of Meyda Analyzer 1
                    var matrix1 = origin_data1;
                    var matrix11 = [];

                    //Create self_similarity data based on origin_data by calculate Euclidean distance between each pair of data point of origin_data
                    var matrix11 = predata(matrix1)

                    //draw self_similarity matrix1
                    drawmatrix(matrix11)

                    //Start processing the next audio file
                    getData2(url2, matrix11)
                }


            });
        }

        request.send();
    }


    function getData2(audiofile2, matrix11) {
        //do the same thing as processing the audio 1, get the duration of audio first then render the audio data to offline audio context, and take it as input to Meyda Analyzer 2
        var audioCtx2 = new AudioContext();
        var source2 = audioCtx2.createBufferSource()

        //use XMLHttpRequest to load audio tract
        var request2 = new XMLHttpRequest();
        request2.open('GET', audiofile2, true);

        //return the audio data to audioData variable type arraybuffer
        request2.responseType = 'arraybuffer';

        request2.onload = function () {
            audioData2 = request2.response;

            //decode the audio data from array buffer and stored to AudioBufferSourceNode
            audioCtx2.decodeAudioData(audioData2, function (buffer) {

                source2.buffer = buffer;
                var duration2 = [];
                duration2.push(source2.buffer.duration)

                var offlineCtx2 = new OfflineAudioContext(1, 44100 * duration2[0], 44100);
                var source22 = offlineCtx2.createBufferSource()
                source22.buffer = buffer;
                source22.connect(offlineCtx2.destination);
                source22.start();

                meydaAnalyzer2 = Meyda.createMeydaAnalyzer({
                    'audioContext': offlineCtx2,
                    'source': source22,
                    'melBands': 26,
                    'sampleRate': 44100,
                    'bufferSize': 16384,
                    'hopSize': 256,
                    'numberOfMFCCCoefficients': 20,
                    'featureExtractors': [featureType, featureType2],
                    'callback': show2

                })
                meydaAnalyzer2.start()
                console.log(Meyda.sampleRate)
                //Start render audio data 2
                offlineCtx2.startRendering()

                //When render completed do the following steps
                offlineCtx2.oncomplete = function (k) {
                    //copy data generated from Meyda Analyzer
                    var matrix2 = origin_data2

                    //process self_similarity data from origin_data2
                    var matrix22 = predata(matrix2)

                    //draw self_similarity matrix of audio 2
                    drawmatrix(matrix22)

                    //function preprocess() in function dataprocess() takes much time to complete
                    console.log("before dataprocess:...")
                    // dataprocess(matrix11, matrix22)
                    console.log("after dataprocess:... ")

                    //Display information of audio 2 including duration, buffersize, hopsize
                    addText("Audio 2 duration (sec): " + math.round(duration2[0] * 10) / 10, matrix11.length + matrix2.length, 160)
                    addText("Audio 2 self_compare_score", matrix11.length + matrix2.length, 130)
                    addText(url2, matrix11.length + matrix2.length, 100)
                    addText("bufferSize:" + Meyda.bufferSize, matrix11.length + matrix2.length, 70)
                    addText("hopSize:" + Meyda.hopSize, matrix11.length + matrix2.length, 40)
                }


            });
        }

        request2.send();
    }


}

//function to play audio file 1
function playsound1(buffer) {
    var song = audioCtx.createBufferSource();
    song.buffer = buffer;
    song.connect(audioCtx.destination);
    song.start(0)
}

//function to play auido file 2
function playsound2(buffer) {
    var song2 = audioCtx.createBufferSource();
    song2.buffer = buffer;
    song2.connect(audioCtx.destination);
    song2.start(0)
}

//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function show1(features) {

    mfcc = features[featureType]
    rms = features[featureType2]
    if (rms != 0) {
        origin_data1.push(mfcc)
    }
}

//function callback of Meyda Analyzer 2 which calculate mfcc coefficient
function show2(features) {

    mfcc = features[featureType]
    rms = features[featureType2]
    if (rms != 0) {
        origin_data2.push(mfcc)
    }
}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function drawmatrix(self_similarity_data) {
    //scale the self_similarity data value to draw
    var CSM22 = d3.scaleLinear()
        .domain([math.min(self_similarity_data), math.max(self_similarity_data)])
        .range([1, 0]);

    var scaled_self_similarity_data = [];

    for (var i = 0; i < self_similarity_data.length; i++) {
        var CSM44 = [];
        for (var j = 0; j < self_similarity_data[0].length; j++) {
            CSM44.push(CSM22(self_similarity_data[i][j]))
        }
        scaled_self_similarity_data.push(CSM44)
    }

    //Create color data from scaled_self_similarity_data
    var color_data = [];
    for (var i = 0; i < scaled_self_similarity_data.length; i++) {
        var data3 = [];
        for (var j = 0; j < scaled_self_similarity_data[0].length; j++) {

            //get R G B value after convert scaled self similarity data to HSL color scale
            data3.push(d3.rgb(d3.hsl(scaled_self_similarity_data[i][j] * 257, 1, 0.5)));
        }
        color_data.push(data3);
    }

    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    // define the size of image
    var imgData = ctx.createImageData(color_data[0].length, color_data.length);
    console.log(imgData);

    //draw each pixel, one pixel contain 4 values (R G B A),
    for (var i = 0; i < color_data.length; i++) {
        for (var j = 0; j < color_data[0].length; j++) {

            //each step is 4, the next pixel value have index in position 4 5 6 7,
            var pos = (i * color_data[0].length + j) * 4;
            imgData.data[pos + 0] = color_data[i][j].r;
            imgData.data[pos + 1] = color_data[i][j].g;
            imgData.data[pos + 2] = color_data[i][j].b;
            imgData.data[pos + 3] = 255;
        }
    }
    console.log(imgData.data);

    //where to draw the whole image
    ctx.putImageData(imgData, count * (origin_data1.length + origin_data2.length), 0);
    ++count
}

//function to process the origin_data to self_similarity data by comparing euclidean distance of every pair of data point
function predata(origin_data) {

    // data normalization
    var normalized_data = [];
    for (var i = 0; i < origin_data.length; i++) {
        var data1 = [];

        var average = math.mean(origin_data[i]);
        for (var j = 0; j < origin_data[0].length; j++) {
            data1.push((origin_data[i][j] - average) / math.norm(origin_data[i][j] - average));
        }
        normalized_data.push(data1);
    }

    //calculate euclidean distance between two mfcc vector->create self similarity matrix
    var self_similarity_data = [];
    for (var i = 0; i < normalized_data.length; i++) {
        var data2 = [];
        for (var j = 0; j < normalized_data.length; j++) {
            data2.push(euclideanDistance(normalized_data[i], normalized_data[j]))
        }
        self_similarity_data.push(data2);
    }

    return self_similarity_data;
}


function euclideanDistance(a, b) {
    var sum = 0;
    if (a.length == b.length) {
        for (var i = 0; i < a.length; i++) {
            sum += math.pow(a[i] - b[i], 2)
            // sum=math.norm([a[i],b[i]],'fro')
        }
        //if 2 vector does not have the same data lenthg, fill 0 to the rest of smaller dimension vector
    } else if (a.length < b.length) {
        a = a.concat(Array(b.length - a.length).fill(0))
        for (var i = 0; i < b.length; i++) {

            sum += math.pow(a[i] - b[i], 2)
            // sum=math.norm([a[i],b[i]],'fro')
        }

    } else {
        b = b.concat(Array(a.length - b.length).fill(0))
        for (var i = 0; i < a.length; i++) {

            sum += math.pow(a[i] - b[i], 2)
            // sum=math.norm([a[i],b[i]],'fro')
        }

    }
    return Math.sqrt(sum)
}

//function to display svg text
function addText(value, x, y) {
    let svg = d3.select("#svg1");
    svg.append("text").text(value).attr("x", x).attr("y", y).attr("font-size", "30px");
}

//process the data by comparing Euclidean distance between two self_similarity data, create binary matrix, and perform calculating SmithWaterman score for 2 audio files
function dataprocess(selfmatrix1, selfmatrix2) {

    //Create Cross similarity Matrix from 2 SSM data
    function preprocess() {
        var crossscore = [];
        for (var i = 0; i < selfmatrix1.length; i++) {
            var crossimilarity_matrix = [];
            for (var j = 0; j < selfmatrix2.length; j++) {
                crossimilarity_matrix.push(euclideanDistance(selfmatrix1[i], selfmatrix2[j]))
            }
            crossscore.push(crossimilarity_matrix)
        }
        return crossscore
    }

//Calculate the median of Euclidean distance of two self_similarity matrix-> Euclidean Score between two audio files
    function displayssm(cross_similarity_data) {
        var ssmcompare = [];
        for (var i = 0; i < cross_similarity_data.length; i++) {
            ssmcompare.push(math.min(cross_similarity_data[i]))

        }
        return math.round(math.median(ssmcompare))
    }


//This part is following the SmithWaterman Algorithm
    function sortrow(cross_similaritydata) {

//sort the row of cross similarity matrix then take the k*row.length point
        var rowsort = [];
        for (var i = 0; i < cross_similaritydata.length; i++) {
            rowsort.push(cross_similaritydata[i].sort(function (a, b) {
                return a - b;
            }))
        }
        var rowsortmin = [];

        var number = math.round(cross_similaritydata.length * 0.1)

        for (var i = 0; i < rowsort.length; i++) {
            rowsortmin.push(rowsort[i][number])
        }
        return rowsortmin;
    }

//sort the column
    function sortcol(crosssimilarity_data) {
        //transform all the column of the matrix to row, then sort the row
        var column = _.unzip(crosssimilarity_data)
        var sortcolumn = [];
        for (var i = 0; i < column.length; i++) {
            //sort function
            sortcolumn.push(column[i].sort(function (aa, bb) {
                return aa - bb;
            }))
        }
        var number = math.round(sortcolumn[0].length * 0.1)

        var sortcolumnmin = [];
        for (var i = 0; i < sortcolumn.length; i++) {
            sortcolumnmin.push(sortcolumn[i][number]);

        }
        return sortcolumnmin;

    }


//draw binary matrix
    function drawbinarymatrix(crosssimilaritydata, sortrowdata, sortcolumdata) {
        for (var i = 0; i < crosssimilaritydata.length; i++) {
            for (var j = 0; j < crosssimilaritydata[0].length; j++) {

                //Generate binary matrix which 1 and 0 value
                if (crosssimilaritydata[i][j] < math.min(sortrowdata[i], sortcolumdata[j])) {
                    crosssimilaritydata[i][j] = 1;
                } else {
                    crosssimilaritydata[i][j] = 0;
                }
            }
        }

        var c = document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        var imgData = ctx.createImageData(crosssimilaritydata[0].length, crosssimilaritydata.length);

        for (var i = 0; i < crosssimilaritydata.length; i++) {
            for (var j = 0; j < crosssimilaritydata[0].length; j++) {
                var pos = (i * crosssimilaritydata[0].length + j) * 4;
                imgData.data[pos + 0] = 0;
                imgData.data[pos + 1] = 0;
                imgData.data[pos + 2] = 0;
                imgData.data[pos + 3] = crosssimilaritydata[i][j] * 255;
            }
        }
        console.log(imgData.data);
        //where to draw the whole image
        ctx.putImageData(imgData, (count - 1) * (crosssimilaritydata.length + crosssimilaritydata[0].length), math.max(crosssimilaritydata.length, crosssimilaritydata[0].length));
    }

    function Delta(binaryvalue1, binaryvalue2) {
        var gapOpening = -0.5;
        var gapExtension = -0.7;
        if (binaryvalue2 > 0) {
            return 0;
        } else if (binaryvalue2 == 0 && binaryvalue1 > 0) {
            return gapOpening;
        } else {
            return gapExtension;
        }
    }

    function Match(i) {
        var matchScore = 1;
        var mismatchScore = -1;
//if value = 0 , mismatch, 1 -> match
        if (i == 0) {
            return mismatchScore
        } else {
            return matchScore
        }
    }

//Calculate SmithWaterman Score
    function score(similar) {
        //Create a matrix D full of zeros value with size (cross_similarity_matrix length+1,cross_similarity_matrix length+1)
        var arr = Array(similar.length + 1).fill(Array(similar[0].length + 1));
        var D = math.zeros(math.size(arr))
        var maxD = 0;
        for (i = 3; i < D.length; i++) {
            for (j = 3; j < D[0].length; j++) {
                var MS = Match(similar[i - 1][j - 1])
//H_(i-1, j-1) + S_(i-1, j-1) + delta(S_(i-2,j-2), S_(i-1, j-1))
                var d11 = D[i - 1][j - 1] + MS + Delta(similar[i - 2][j - 2], similar[i - 1][j - 1])
//H_(i-2, j-1) + S_(i-1, j-1) + delta(S_(i-3, j-2), S_(i-1, j-1))
                var d22 = D[i - 2][j - 1] + MS + Delta(similar[i - 3][j - 2], similar[i - 1][j - 1])
//H_(i-1, j-2) + S_(i-1, j-1) + delta(S_(i-2, j-3), S_(i-1, j-1))
                var d33 = D[i - 1][j - 2] + MS + Delta(similar[i - 2][j - 3], similar[i - 1][j - 1])
                D[i][j] = math.max(d11, d22, d33, 0)
                if (D[i][j] > maxD) {
                    maxD = D[i][j];
                }
            }

        }

        return maxD;

    }

//copy value of cross similarity data after processing to use for each function
    var matt1 = [];
    var matt2 = [];
    var matt3 = [];
    var sortrow1 = [];
    var sortcol1 = [];
    var scoreee = 0;
    var euclideanscore = 0;
//get cross similarity data
    matt1 = preprocess()
    // copy the data to 2 other variable matt2 and matt3
    matt2 = matt1.map(a => a.slice())
    matt3 = matt1.map(a => a.slice())

    //sort row of cross similarity data
    sortrow1 = sortrow(matt2);

    //sort column of cross similarity data
    sortcol1 = sortcol(matt3);

    //calculate euclidean distance by get median of cross similarity distance
    euclideanscore = displayssm(matt1)

    //draw cross similarity matrix
    drawmatrix(matt1)

    //draw binary matrix
    drawbinarymatrix(matt1, sortrow1, sortcol1);

    //get SmithWaterman Score
    scoreee = score(matt1)

    //Display information of dissimilarity Matrix, Euclidean score, SmithWaterman Score
    addText("Euclidean score: " + euclideanscore, (count - 1) * (selfmatrix1.length + selfmatrix2.length), 160)
    addText("SmithWaterman: " + scoreee, (count - 1) * (selfmatrix1.length + selfmatrix2.length), 130)
    addText("Audio 1 and Audio 2 dissimilarity score", (count - 1) * (selfmatrix1.length + selfmatrix2.length), 100)
}


