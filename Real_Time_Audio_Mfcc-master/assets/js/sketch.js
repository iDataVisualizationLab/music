// setup init variables
var defaultMfcc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
var mfcc = defaultMfcc;
var rms = 0
var featureType = 'mfcc'
var featureType2 = 'rms'
var Listening = false
var threshold = 0.001 // threshold on rms value
//var mfccThreshold = 0.1 // threshold on mffc feature values
var silence = true
// draw init variables
var data = [];
var rectWidth = 25
var rectHeight = 20
var maxDataLength = 60
var count = -1;
var startButton = null;
matrix1 = [];
matrix2 = [];
matrix11 = [];
matrix22 = [];
origin_data = [];

function setup() {
    // noLoop();
    // initialisations
    window.AudioContext = window.AudioContext || window.webkitAudioContext
    var context = new AudioContext()
    //var source = null
    // canvas setup
    createCanvas(rectWidth * maxDataLength, rectHeight * defaultMfcc.length)
    background(255, 230, 150)


    // get microphone
    // navigator.getUserMedia({audio: true, video: false}, function (stream) {
        // get audio stream data
        // source1 = context.createMediaStreamSource(stream)
        const audio1 = document.getElementById("audio1");
        const source1 = context.createMediaElementSource(audio1);
        source1.connect(context.destination);

        const audio2 = document.getElementById("audio2");
        const source2 = context.createMediaElementSource(audio2);
        source2.connect(context.destination);

        meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
            'audioContext': context,
            'source': source1,
            'melBands': 26,
            'sampleRate': 44100,
            'bufferSize': 2048,
            'featureExtractors': [featureType, featureType2],
            'callback': show
        })
        //meydaAnalyzer1.start([featureType, featureType2])

        meydaAnalyzer2 = Meyda.createMeydaAnalyzer({
            'audioContext': context,
            'source': source2,
            'melBands': 26,
            'sampleRate': 44100,
            'bufferSize': 2048,
            'featureExtractors': [featureType, featureType2],
            'callback': show
        })
        //meydaAnalyzer2.start([featureType, featureType2])


        // buttons
        startButton = createButton('Start')
        startButton.mousePressed(function () {
            //loop();
            // start audio analyzer
            if (Listening == true) {
                ++count
                origin_data = [];
                meydaAnalyzer2.start([featureType, featureType2])
                audio2.play()
                audio2.onended = function () {
                    matrix2 = origin_data
                    matrix22 = predata(matrix2)
                    drawmatrix(matrix22)
                    crossscore = [];
                    crossimilarity = [];
                    for (var i = 0; i < matrix1.length; i++) {
                        CSM = [];
                        for (var j = 0; j < matrix2.length; j++) {
                            CSM.push(euclideanDistance(matrix1[i], matrix2[j]))
                        }
                        crossimilarity.push(CSM.slice());
                        crossscore.push(CSM.slice())
                    }
                    displayssm(crossimilarity)
                    dataprocess()
                }
                startButton.html('Stop')
                startButton.style('background:#aa0')


            } else {
                ++count
                meydaAnalyzer1.start([featureType, featureType2])
                audio1.play()
                audio1.onended = function () {
                    matrix1 = origin_data
                    matrix11 = predata(matrix1)
                    drawmatrix(matrix11)

                }

                //stream data
                // ++count
                // meydaAnalyzer1.start([featureType, featureType2])
                // if(count==1) {
                //     meydaAnalyzer1.stop()
                //     matrix1 = origin_data
                //     matrix11 = predata(matrix1)
                //     drawmatrix(matrix11)
                //     Listening = true
                // }
                Listening = true
                startButton.html('Start_again')
                startButton.style('background:#aaf')
                console.log(count)


            }

        })
    // }, function (error) {
    //     console.log(error)
    // })

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

    }

//origin_data is an array of array of each mfcc (13 coefficients)-the meyda algorithm calculated 44100 Hz/512 buffer=86 mfcc/second
    function show(features) {
        // update spectral data size

        mfcc = features[featureType] //features["mfcc"]
        rms = features[featureType2]
        if (rms > threshold) {
            origin_data.push(mfcc)
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

    function euclideanDistance(a, b) {
        sum = 0;
        for (var i = 0; i < a.length; i++) {

            sum += math.pow(a[i] - b[i], 2)
        }
        return math.sqrt(sum)
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
        var imgData = ctx.createImageData(color_data.length, color_data.length);
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
        ctx.putImageData(imgData, count * (math.max(matrix2.length, matrix1.length) + 5), 0);
    }


    function displayssm() {
        ssmcompare = [];
        for (var i = 0; i < crossimilarity.length; i++) {
            ssmcompare.push(math.min(crossimilarity[i]))

        }
        return document.getElementById("demo").innerHTML = "Euclidean Score: " + (math.median(ssmcompare));
    }


    function dataprocess() {

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
            number = math.round(a.length * 0.05)
            console.log(number)
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
            number = math.round(a[0].length * 0.05)
            console.log(number)
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
            ctx.putImageData(imgData, count * (math.max(matrix2.length, matrix1.length) + 5), 300);

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
        sortrow(crossscore);
        sortcol(crossscore);
        drawbinarymatrix(crossimilarity);
        document.getElementById("smith").innerHTML = "SmithWaterman Score: " + score(crossimilarity);


    }


