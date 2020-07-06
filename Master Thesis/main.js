let audio_label = [];
let fileContent = [];
let featureType = 'mfcc';
let featureType2 = 'rms';
let invalid_mfcc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let mfcc_data = [];
let mfcc_data_all = [];
let draw_ssm_worker;

let tsne_worker;
let tsne_data_worker;
let feature_selection = "t";
let feature_selected_mode = false;
let count_done = 1;
let count_load = 1;
let store_process_tsne_data = [];
let empty = [];
//minimum spanning tree
let selected_node = false;
let start_node_id;
let end_node_id;

let fakeDataforfirstplot = [];
let store_image_in_canvas = [];
let firstdraw = true;
var Isrecord = false;
let audioChunks = [];

//Machine Learning
let model;
let state = 'collection';
let predict_array = [];
var count_click = 2;
var heatmap_max_length = 27;

//get file directory
window.onload = function () {


    //Load the sound sample then get the sound label
    d3.select("#loader").style("display", "none");
    document.getElementById("filepicker").addEventListener("change", function (event) {
        if (count_load > 1) {
            reset_variable();
        }
        audio_label = [];
        let files = event.target.files;
        // console.log(files);
        for (i = 0; i < files.length; i++) {
            // if (files[i].lastModified > 1370000000000){
            audio_label.push(files[i].name.split('_').slice(0, 2).slice(0, 1).join("_"));
            // }
            // else {
            //     audio_label.push(files[i].name.split('_').slice(0, 2).join("_"));
            // }
            // audio_label.push(files[i].name);
            fileContent.push(URL.createObjectURL(files[i]));
            fakeDataforfirstplot.push([0]);
        }
        fakeDataforFirstScatterplot();
        //getData function was called recursively to
        get_mfcc_data(fileContent[0], 0);
        count_load++
        $("#filepicker").val('');
    }, false);
}


Audio.prototype.isPlaying = function () {
    return this
        && this.currentTime > 0  // Audio has started playing
        && !this.paused          // Audio playback is not paused
        && !this.ended           // Audio playback is not ended
        && this.readyState >= 3; // Audio data is available and ready for playback
};
Audio.prototype.stop = function () {
    // Pause the playback
    this.pause();
    // Reset the playback time marker
    this.currentTime = 0;
};
let width = window.innerWidth / 2.5, height = window.innerHeight / 2,
    margin = {left: 50, top: 50, right: 50, bottom: 50},
    contentWidth = (width - margin.left - margin.right)/1.5,
    contentHeight = (height - margin.top - margin.bottom)/2;


function setup() {
    canvas_width = windowWidth / 2.5, canvas_height = windowHeight / 4.5;
    BOX_WIDTH = canvas_width / 140;
    BOX_HEIGHT = canvas_height / 28;
    // create svg element

    var live_canvas = createCanvas(canvas_width, canvas_height);
    live_canvas.parent('live_canvas');
    background(0)
    var svg = d3.select("#live_canvas")
        .append("svg")
        .attr('class','yaxis')
        .attr("width", BOX_WIDTH*8)
        .attr("height", canvas_height+20);

// Create the scale
    var scale = d3.scaleLinear()
        .domain([1, 13])         // This is what is written on the Axis: from 0 to 100
        .range([0, canvas_height-25]);       // This is where the axis is placed: from 100px to 800px

    var y_axis = d3.axisLeft()
        .scale(scale);

    svg.append("g")
        .attr("transform", "translate(25, 12)")

        .call(y_axis);


    //Create worker to draw self-similarity-matrix in canvas whenever it has data
    draw_ssm_worker = new Worker('drawssm.js');
    tsne_data_worker = new Worker('process_tsne_data.js');
    tsne_worker = new Worker('new_tsne_worker.js');


    //draw color legend for heatmap
    domain_heatmap = [-1, 1, 50, 100, 150, 200, 250, 300];
    generator_heatmap = d3.scaleLinear()
        .domain([0, 1, 2, 3, 4, 5, 6, 7])
        .range([
            d3.rgb(220, 220, 220), d3.rgb(0, 156, 255), d3.rgb(0, 255, 164), d3.rgb(63, 255, 0), d3.rgb(214, 245, 0), d3.rgb(255, 166, 0), d3.rgb(255, 97, 0), d3.rgb(200, 65, 65)]
        )
        .interpolate(d3.interpolateCubehelix)
    range_heatmap = d3.range(domain_heatmap.length).map(generator_heatmap);
    quantile_heatmap = d3.scaleQuantile()
        .domain(domain_heatmap)
        .range(range_heatmap);
    column("d3.scaleQuantile", quantile_heatmap);

    function column(title, scale) {
        var legend = d3.legendColor()
            // .labelFormat(d3.format(",.0f"))
            .labels([-1, 0, 40, 80, 120, 160, 200, 240])
            .cells(5)
            .orient('horizontal')
            .labelAlign("start")
            .shapeWidth(65)
            // .labelWrap(30)
            .scale(scale);

        var legend_heat = d3.select("#live_canvas").append('svg').attr("width", windowWidth / 2.5).attr("height", windowHeight / 24);

        legend_heat.append("g")
            .attr("class", "legendQuant")
            .attr("transform", "translate(10,-5)");

        legend_heat.select(".legendQuant")
            .call(legend);
    };

    //initiate scatter plot for tsne
    svg_scatterplot = d3.select("#theGraph")
        .append("div")
        .classed("svg-container", true)
        .append("svg")
        // .attr("width", width)
        // .attr("height", height)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", "0 0 600 400")
        .attr("xmln","http://www.w3.org/2000/svg")
        .classed("svg-content", true);

    scatterplot = svg_scatterplot
        .append("g")
        .attr("transform", `translate(${50}, ${20})`)
        .attr("id", "snodes");

    //Do Machine Learning test
    let store_feature = Array.from(Array(39), (x, index) => index.toString())
    let options = {
        inputs: store_feature,
        outputs: ['label'],
        task: 'classification',
        debug: 'true'
    };
    model = ml5.neuralNetwork(options);
}


function get_mfcc_data(a, index) {

    //Create audioContext to decode the audio data later
    var audioCtx = new AudioContext();
    //Create source as a buffer source node which contains the audio data after decoding
    var source = audioCtx.createBufferSource();
    //use XMLHttpRequest to load audio track
    var request = new XMLHttpRequest();
    //Open audio file
    request.open('GET', a, true);
    //The response is a JavaScript ArrayBuffer containing binary data.
    request.responseType = 'arraybuffer';
    //return the audio data to audioData variable type arraybuffer
    request.onload = function () {
        d3.select("#loader").style("display", "block");
        var audioData = request.response;
        //decode the audio data from array buffer and stored to AudioBufferSourceNode
        audioCtx.decodeAudioData(audioData, function (buffer) {
            //store data to buffer source node
            source.buffer = buffer;
            //find the duration of the audio in second after decoding
            var duration1 = 0;
            duration1 = source.buffer.duration;
            // console.log(duration1);
            //ignore the sound sample's duration exceeds the default setting
            if (duration1 > parseInt($('#duration').val(), 10)) {
                fileContent.splice(index, 1)
                audio_label.splice(index, 1)
                if (index != fileContent.length) {
                    get_mfcc_data(fileContent[index], index)
                }
            } else {
                //create offline audio context to render the decoding audio data then use the offline audio context and another audio buffer source node as inputs to Meyda Analyzer
                var offlineCtx = new OfflineAudioContext(1, parseInt($('#samplerate').val(), 10) * duration1, parseInt($('#samplerate').val(), 10));
                //create buffer source node which is used in Meyda Analyzer
                var source11 = offlineCtx.createBufferSource();
                //store the audio data to the buffer source node again
                source11.buffer = buffer;
                //connect the source node to offline audio context then go to Meyda Analyzer
                source11.connect(offlineCtx.destination);
                //start the buffer source node
                source11.start();
                var windowsize = parseInt($('#windowsize').val(), 10);
                //Create Meyda analyzer and set up the parameter
                meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
                    'audioContext': offlineCtx,
                    'source': source11,
                    'melBands': 26,
                    'sampleRate': parseInt($('#samplerate').val(), 10),
                    'bufferSize': windowsize,
                    // 'hopSize': windowsize / (parseInt($('#duration').val(), 10) / duration1),
                    // 'hopSize': parseInt($('#hopsize').val(), 10),
                    'hopSize': windowsize / 2,
                    'numberOfMFCCCoefficients': 13,
                    'featureExtractors': [featureType, featureType2, 'amplitudeSpectrum'],
                    'callback': mfcc_extract
                });
                //start Meyda Analyzer
                meydaAnalyzer1.start();
                // var hop = Meyda.hopSize;
                // var buf = Meyda.bufferSize;
                // var dur = duration1;
                // audio_statistic.push({duration: dur, bufferSize: buf, hopSize: hop})
                //Using offline audio context to render audio data
                offlineCtx.startRendering();
                //After complete rendering, performing the following steps
                offlineCtx.oncomplete = function (e) {
                    //call function to start process when mfcc data is available
                    all_worker_process();

                    //Create self_similarity data based on origin_data by calculate Euclidean distance between each pair of data point of origin_data
                    ++index;
                    console.log("loading" + index)
                    //call the function get_mfcc_data recursively
                    if (index < fileContent.length) {
                        get_mfcc_data(fileContent[index], index)
                    } else if (index == fileContent.length) {
                        d3.select("#loader").style("display", "none");
                    }
                }
            }
        }).catch(function (err) {
            console.log('Rendering failed: ' + err);
            // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
        });
    };
    request.send();
    return 0;
}

function selectfeature(value) {
    feature_selection = value;
    feature_selected_mode = true;
    store_process_tsne_data = [];
    tsne_data_worker.postMessage({
        data: mfcc_data_all,
        select_feature: feature_selection,
        control: 'rerun'
    })
}

function all_worker_process() {
    tsne_config = {
        opt: {
            epsilon: 10, // epsilon is learning rate (10 = default)
            perplexity: parseInt($('#myRange1').val(), 10), // roughly how many neighbors each point influences (30 = default)
            // tsne_iteration: parseInt($('#myRange2').val(), 10) || 100,
            dim: 2 // dimensionality of the embedding (2 = default)

        }
    };
    console.log('iam here');
    var store_each_sound_mfcc = [];
    //mfcc_data is generated from function show1 of Meyda Analyzer 1 of each sound samples
    store_each_sound_mfcc = mfcc_data;

    //mfcc_data_all contains all the mfcc features of all sound samples
    mfcc_data_all.push(store_each_sound_mfcc);
    draw_ssm_worker.postMessage({
        data: store_each_sound_mfcc
    });
    tsne_data_worker.postMessage({
        data: store_each_sound_mfcc,
        select_feature: feature_selection,
        control: 'normal'
    })

    draw_ssm_worker.onmessage = function (e) {
        console.log("draw_ssm is ready");
        var msg = e.data;
        switch (msg.message) {
            case 'READY':
                // console.log(msg.data);
                store_image_in_canvas.push(draw_matrix(msg.data));
                break;
            default:
                break;
        }
    }

    tsne_data_worker.onmessage = function (e) {
        var msg = e.data;

        switch (msg.message) {
            case 'BUSY':
                // console.log('tsne_data_worker is busy');
                break;
            case 'READY':
                // console.log('tsne_data_worker is ready');
                store_process_tsne_data.push(msg.value);
                if (state == 'prediction') {
                    var inputs = {};
                    for (i = 0; i < msg.value.length; i++) {
                        var name = i;
                        inputs[name] = msg.value[i];
                    }
                    wsTooltipDiv.style("visibility", "visible").style("top", "150").style("left", "150");
                    predict(inputs, gotResults);
                }
                // console.log("process" + "" + store_process_tsne_data.length);
                if (store_process_tsne_data.length == 2) {
                    tsne_worker.postMessage({message: 'initTSNE', value: tsne_config.opt});
                    tsne_worker.postMessage({message: 'initTSNE', value: tsne_config.opt});
                }
                if (store_process_tsne_data.length > 2) {
                    tsne_worker.postMessage({
                        message: 'DataReady',
                    });
                }

                break;
            case 'FEATURES':
                // tsne_worker.terminate();
                store_process_tsne_data = (msg.value);
                tsne_worker.postMessage({message: 'features', data: store_process_tsne_data, value: tsne_config.opt});
                break;
            default:
                break;
        }
    }

    tsne_worker.onmessage = function (e) {
        var msg = e.data;
        switch (msg.message) {
            case 'BUSY':
                // console.log('Iam busy');
                break;
            case 'READY':
                tsne_worker.postMessage({
                    message: 'RUN',
                    value: store_process_tsne_data.slice(0, 2)
                });
                break;
            case 'Update':
                if (store_process_tsne_data.length > msg.index && store_process_tsne_data.length <= fileContent.length) {
                    // console.log(msg.index);
                    tsne_worker.postMessage({
                        message: 'UpdateData',
                        value: store_process_tsne_data.slice(0, msg.index + 1)
                    })
                }

                if (fileContent.length == msg.index || (store_process_tsne_data.length == parseInt($('#recordingsample').val(), 10) && Isrecord == true)) {
                    tsne_worker.postMessage({
                        message: 'Done'
                    })
                }
                break;
            case 'DrawUpdate':
                if(store_process_tsne_data.length <= msg.value.length) {
                    try {
                        UpdateDataTSNE(msg.value);
                    } catch (err) {
                        setTimeout(() => {
                            console.log("Waiting for data");
                            ;
                        }, 100);
                    }
                }
                // console.log("drawing" + "" + msg.value.length);
                xScale = d3.scaleLinear()
                    .domain(d3.extent(msg.value.flat()))
                    .range([0, contentWidth]);
                yScale = d3.scaleLinear()
                    .domain(d3.extent(msg.value.flat()))
                    .range([0, contentHeight]);

                scatterplot.selectAll(".texte").data(store_process_tsne_data.slice(0, msg.value.length))
                    .text(function (d) {
                        return d.label;
                    })
                    .attr("x", d => (xScale(d.x)))
                    .attr("y", d => (yScale(d.y)));
                // }
                break;
            case 'DrawUpdateFeature':
                draw_feature(msg.value);
                break;
            case 'Done':
                // draw_ssm_worker.terminate();
                if (Isrecord == true && feature_selected_mode != true) {
                    mfcc_data_all.forEach(d =>
                        store_image_in_canvas.push(draw_matrix(predata_copy(d)))
                    );
                    stopStream()
                    // tsne_worker.terminate();
                    fileContent = [];
                    store_process_tsne_data.forEach(d => {
                            audio_label.push(d.id);
                        }
                    )
                    count_done++
                    console.log(count_done);
                }
                firstdraw = false;

                if (count_done >= 2 || (Isrecord == false && store_image_in_canvas.length == store_process_tsne_data.length)) {
                    // console.log(store_image_in_canvas);
                    drawscatterplot(msg.value);
                    // console.log(msg.value);
                    console.log('draw' + ' final');
                } else {
                    tsne_worker.postMessage({
                        message: 'Done'
                    })
                }
                console.log('draw' + ' here');

                //Get Euclidean Distance Comparision
                store_process_tsne_data.forEach(d => {
                        var store_distance = [];
                        var store_label = [];
                        var id_array = [];
                        store_process_tsne_data.forEach(dataarray => {
                            if (d.id != dataarray.id) {
                                store_distance.push(euclideanDistance(dataarray, d))
                                store_label.push(dataarray.label);
                                id_array.push(dataarray.id);
                            }
                        })
                        d.distance_array = store_distance;
                        d.label_array = store_label;
                        d.id_array = id_array;
                    }
                )
            break;
            default:
                break;

        }
    }
    mfcc_data = [];
}

function draw_feature(datar){
    svg_scatterplot.selectAll("image").style("opacity", 1);
    scatterplot.selectAll("path").remove()
    UpdateDataTSNE(datar);
    // console.log("drawing" + "" + msg.value.length);
    xScale = d3.scaleLinear()
        .domain(d3.extent(datar.flat()))
        .range([0, contentWidth]);
    yScale = d3.scaleLinear()
        .domain(d3.extent(datar.flat()))
        .range([0, contentHeight]);
    scatterplot.selectAll("text").data(store_process_tsne_data)
        .attr("x", d => (xScale(d.x)))
        .attr("y", d => (yScale(d.y)));
    scatterplot.selectAll("image").data(store_process_tsne_data)
        .attr("x", d => (xScale(d.x)))
        .attr("y", d => (yScale(d.y)));
    store_process_tsne_data.forEach(d => {
        var store_distance = [];
        var store_label = [];
        var id_array = [];
        store_process_tsne_data.forEach(dataarray => {
            if (d.id != dataarray.id) {
                store_distance.push(euclideanDistance(dataarray, d))
                store_label.push(dataarray.label);
                id_array.push(dataarray.id);
            }
        })
        d.distance_array = store_distance;
        d.label_array = store_label;
        d.id_array = id_array;
    });
}
//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function mfcc_extract(features) {
    var mfcc = features[featureType];
    var rms = features[featureType2];
    // var spectrum = features['amplitudeSpectrum'];
    //mfcc data contains all the mfcc feature extracted from sound in time series
    if (rms > 0 && mfcc != invalid_mfcc) {
        mfcc_data.push(mfcc)
    }
    if (Isrecord == true & mfcc_data.length % parseInt($('#samplelength').val(), 10) == 0 & mfcc_data.length > 0) {
        all_worker_process()
    }

}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function draw_matrix(self_similarity_data) {
    var canvas = "compareCanvas";
    //scale the self_similarity data value to draw
    var CSM22 = d3.scaleLinear()
        .domain([math.min(self_similarity_data), math.max(self_similarity_data)])
        .range([0, 1]);
    var scaled_self_similarity_data = [];
    for (var i = 0; i < self_similarity_data.length; i++) {
        var CSM44 = [];
        for (var j = 0; j < self_similarity_data[0].length; j++) {
            CSM44.push(CSM22(self_similarity_data[i][j]))
        }
        scaled_self_similarity_data.push(CSM44);
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
    c.style.visibility = "hidden";
    var ctx = c.getContext("2d");
    ctx.canvas.width = self_similarity_data.length;
    ctx.canvas.height = self_similarity_data.length;

    // define the size of image
    var imgData = ctx.createImageData(color_data[0].length, color_data.length);
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

    //define where to put the image in canvas
    ctx.putImageData(imgData, 0, 0);

    //save canvas to png image then call back to use in network diagram
    var imagedata = c.toDataURL("image/png");
    return imagedata;
    // console.log("I am calculating the distance");
}

function draw() {
    clear();
    background(220, 220, 220);
    plot(mfcc_data);

}

function plot(data) {
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data [i].length; j++) {
            let color_strength = quantile_heatmap(data[i][j]).replace("rgb", "").replace("(", "").replace(")", "").split(',')
            // let color_strength = data[i][j]*100
            // setting color
            if (data[i][j] >= 0)
                fill(parseInt(color_strength[0]), parseInt(color_strength[1]), parseInt(color_strength[2]))
            // fill(0,color_strength,0)
            else
                fill(209)
            // noStroke();
            //drawing the rectangle
            rect(i * BOX_WIDTH * 2+40, j * BOX_HEIGHT * 2+10, BOX_WIDTH * 2, BOX_HEIGHT * 2)
        }
    }
    // draw_line()
}

function fakeDataforFirstScatterplot() {

    fakeDataforfirstplot.forEach(function (d, i) {
        fakeDataforfirstplot[i].x = 0;  // Add the t-SNE x result to the dataset
        fakeDataforfirstplot[i].y = 0;  // Add the t-SNE y result to the dataset
        fakeDataforfirstplot[i].label = audio_label[i];

    });

    Draw_Scatterplot(fakeDataforfirstplot);

}

//live audio recording, create microphone audio input source from audio context
function createMicSrcFrom(audioCtx) {
    /* get microphone access */
    return new Promise((resolve, reject) => {
        /* only audio */
        let constraints = {audio: true, video: false}
        Isrecord = true;
        reset_variable();
        for (var i = 0; i < parseInt($('#recordlength').val(), 10); i++) {
            fileContent.push([0]);
            fakeDataforfirstplot.push([0]);
            audio_label.push(i);
        }
        fakeDataforFirstScatterplot();
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                window.streamReference = stream;
                /* create source from
                microphone input stream */
                let src = audioCtx.createMediaStreamSource(stream);
                resolve(src);
                record_music(stream);
            }).catch((err) => {
            reject(err)
        })
    })

}

function record_music(stream) {
    const rec = new MediaRecorder(stream);
    rec.addEventListener("dataavailable", event => {
        audioChunks = (event.data);
        var blob = audioChunks[0];
        var chunk_size = blob.size;
        var offset = chunk_size / store_process_tsne_data.length;
        // store_process_tsne_data.forEach((d, i) => {
        //     var chunk = audioChunks[0].slice(offset * i, offset * (i + 1));
        //     chunk = new Blob([chunk], {type: 'audio/webm;codecs=opus'});
        //     fileContent.push(URL.createObjectURL(chunk));
        //     d.url = fileContent[i]
        // })
    });

}

function stopStream() {
    analyzer.stop();
    if (!window.streamReference) return;
    window.streamReference.getAudioTracks().forEach(function (track) {
        track.stop();
    });
    window.streamReference = null;
}

function onMicDataCall(features, callback) {
    return new Promise((resolve, reject) => {

        audiocontextOptions = {sampleRate: parseInt($('#samplerate').val(), 10)};
        var audioCtx = new AudioContext(audiocontextOptions);
        // console.log(audioCtx.sampleRate);
        var windowsize = parseInt($('#windowsize').val(), 10);
        createMicSrcFrom(audioCtx)
            .then((src) => {
                analyzer = Meyda.createMeydaAnalyzer({
                    'audioContext': audioCtx,
                    'source': src,
                    'bufferSize': windowsize,
                    'melBands': 26,
                    'sampleRate': parseInt($('#samplerate').val(), 10),
                    'hopSize': windowsize / 2,
                    'featureExtractors': features,
                    'callback': callback
                })
                resolve(analyzer)
            }).catch((err) => {
            reject(err)
        })
    })
}

function startrecord() {
    // worker2 = new Worker('drawssm.js');
    loop();
    mfcc_history = [];
    //create meyda analyzer and connect to mic source
    onMicDataCall([featureType, featureType2], mfcc_extract)
        .then((meydaAnalyzer) => {
            meydaAnalyzer.start()
        }).catch((err) => {
        alert(err)
    })
}

function windowResized() {
    resizeCanvas(windowWidth / 2.5, windowHeight / 3.5);
    // canvas.position(windowWidth/4, windowHeight/4);
}

//Minimum Spanning Tree
function euclideanDistance(a, b) {
    var sum = 0;
    if (a.length == b.length) {

        sum = distance(a, b);
        //if 2 vector does not have the same data lenthg, fill 0 to the rest of smaller dimension vector
    } else if (a.length < b.length) {
        a = a.concat(Array(b.length - a.length).fill(0))
        sum = distance(a, b);

    } else {
        b = b.concat(Array(a.length - b.length).fill(0))

        sum = distance(a, b)

    }
    return sum
}

function draw_tree(modeselect) {
    svg_scatterplot.selectAll("path").remove();
    let graph1 = {};
    graph1.nodes = [];
    graph1.links = [];
    for (i = 0; i < store_process_tsne_data.length; i++) {
        graph1.nodes.push({"id": i, "links": []})
    }
    var link2 = [];
    switch (modeselect) {
        case "tsne":
            for (i = 0; i < store_process_tsne_data.length - 1; i++) {
                var link1 = [];
                for (j = i + 1; j < store_process_tsne_data.length; j++) {
                    link1.push({
                        "source": i,
                        "target": j,
                        "weight": euclideanDistance([store_process_tsne_data[i].x,store_process_tsne_data[i].y] , [store_process_tsne_data[j].x,store_process_tsne_data[j].y]),
                        "connection": store_process_tsne_data[i].label + " : " + store_process_tsne_data[j].label
                    })
                }
                link2.push(link1)
            }
            break;
        case "raw":
            for (i = 0; i < store_process_tsne_data.length - 1; i++) {
                var link1 = [];
                for (j = i + 1; j < store_process_tsne_data.length; j++) {
                    link1.push({
                        "source": i,
                        "target": j,
                        "weight": euclideanDistance(store_process_tsne_data[i] , store_process_tsne_data[j]),
                        "connection": store_process_tsne_data[i].label + " : " + store_process_tsne_data[j].label
                    })
                }
                link2.push(link1)
            }
        break;
        default:
            break;
    }
    for (i = 0; i < store_process_tsne_data.length - 1; i++) {
        var link1 = [];
        for (j = i + 1; j < store_process_tsne_data.length; j++) {
            link1.push({
                "source": i,
                "target": j,
                "weight": euclideanDistance([store_process_tsne_data[i].x,store_process_tsne_data[i].y] , [store_process_tsne_data[j].x,store_process_tsne_data[j].y]),
                "connection": store_process_tsne_data[i].label + " : " + store_process_tsne_data[j].label
            })
        }
        link2.push(link1)
    }

    graph1.links = d3.merge(link2)

    //create minimumSpanningTree
    minimumSpanningTree = mst(graph1);
    var store_nodes = [];
    minimumSpanningTree.links.forEach(d => {
        store_nodes.push([store_process_tsne_data[d.source], store_process_tsne_data[d.target]])
    })
    draw_path(store_nodes, 100)

}

function draw_shortestpath() {
    var node_circle = [];
    node_circle = svg_scatterplot.selectAll("image")._groups[0];
    minimumSpanningTree.links.forEach(d => {
        minimumSpanningTree.links.push({"source": d.target, "target": d.source, "weight": d.weight})
    })
    var nodes = minimumSpanningTree.nodes;
    var links = minimumSpanningTree.links;

    function convert_graph(graph) {
        var j, k, l, len, len1, map, n, ref;
        map = {};
        ref = graph.nodes;
        for (j = 0, len = ref.length; j < len; j++) {
            n = ref[j];
            for (k = 0, len1 = links.length; k < len1; k++) {
                l = links[k];
                if (n.id === l.source) {
                    if (!(n.id in map)) {
                        map[n.id] = {};
                    }
                    map[n.id][l.target] = l.weight;
                }
            }
        }
        return map;
    };

    var map = convert_graph(minimumSpanningTree);

    var lib_graph = new Graph(map);
    var shortest_path = lib_graph.findShortestPath(start_node_id, end_node_id);
    for (i = 0; i < shortest_path.length; i++) {
        shortest_path[i] = parseInt(shortest_path[i])
    }
    var store_nodes = [];
    shortest_path.forEach((d, i) => {
        if (i < shortest_path.length - 1) {
            store_nodes.push([store_process_tsne_data[shortest_path[i]], store_process_tsne_data[shortest_path[i + 1]]])
        }
    })

    draw_path(store_nodes, 900)
    var store_links = [];
    minimumSpanningTree.links.forEach(d => {
        store_links.push(d.source, d.target)
    })
    svg_scatterplot.selectAll("image").style("opacity", function (d) {
        return shortest_path.includes(d.id) ? 1 : 0.3;
    })
    svg_scatterplot.selectAll("text").style("opacity", function (d) {
        return shortest_path.includes(d.id) ? 1 : 0.3;
    })
    for (var i = 0; i < shortest_path.length; i++) {
        (function (i) {
            setTimeout(function () {
                PlayAudio(node_circle[shortest_path[i]], store_process_tsne_data[shortest_path[i]]);
                d3.select(node_circle[shortest_path[i]])
                    // Does work
                    .attr('width', 20)
                    .attr('height', 20)
                    .transition().duration(500)
                    .attr('width', 10)
                    .attr('height', 10);

            }, 800 * (i + 1));
        })(i);
    }

}

function draw_path(store_nodes, time_play) {
    scatterplot.selectAll("path").remove()
    svg_scatterplot.selectAll("image").style("opacity", 1);

    function length(path) {
        return d3.create("svg:path").attr("d", path).node().getTotalLength();
    }

    var valueline = d3.line()
        .curve(d3.curveCatmullRom)
        .x(function (d) {
            return xScale(d.x);
        })
        .y(function (d) {
            return yScale(d.y);
        });
    const l = length(valueline(store_process_tsne_data));

    for (var i = 0; i < store_nodes.length; i++) {
        (function (i) {
            setTimeout(function () {
                scatterplot.append("path")
                    .data([store_nodes[i]])
                    .attr("fill", "none")
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("stroke-linejoin", "round")
                    .attr("stroke-linecap", "round")
                    .attr("stroke-dasharray", `0,${l}`)
                    .attr("d", valueline)
                    .attr("id", "line" + i)
                    .transition()
                    .duration(500)
                    .ease(d3.easeLinear)
                    .attr("stroke-dasharray", `${l},${l}`);
            }, time_play * (i + 1));
        })(i);
    }

}

//Euclidean Distance Comparision
function draw_euclidean_line_chart(dataset) {
    var myPlot = document.getElementById('Euclidean_distance');
    var trace1 = {
        x: dataset.id_array,
        y: dataset.distance_array,
        mode: 'lines+markers',
        type: 'line',
        name: 'Euclidean Distance',
        text: dataset.label_array,
        marker: {
            color: 'rgb(219, 64, 82)',
            size: 5,
            line: {
                color: 'black',
                width: 0.5
            }
        },

    };

    var layout = {
        // width: windowWidth / 2.2,
        height: windowHeight / 3.5,
        autosize: true,
        // xaxis: {
        //     showgrid: true,
        //     zeroline: true,
        //     showline: true,
        //     showticklabels: true
        // },
        // yaxis: {
        //     showgrid: true,
        //     zeroline: true,
        //     showline: true,
        //     showticklabels: true
        // }
        // margin: {
        //     l: 0,
        // }
    };

    var data = trace1;
    var config = {responsive: true};
    Plotly.newPlot('Euclidean_distance', [data], layout, config);
    myPlot.on('plotly_hover', function(data){
       console.log(data);
       var pointId = data.points[0].x;
        scatterplot.select(".text"+ pointId).style("font-size", "20px").style("opacity",1);
        scatterplot.select(".imagee"+ pointId).attr("width", 20)
            .attr("height", 20);
        clear();
        for(let i = 0; i < mfcc_data_all[pointId].length; i++ ) {
            for (let j = 0; j < mfcc_data_all[pointId][i].length; j++) {
                let color_strength = quantile_heatmap(mfcc_data_all[pointId][i][j]).replace("rgb","").replace("(","").replace(")","").split(',')
                // setting color
                if (mfcc_data_all[pointId] [i] [j] >= 0)
                    fill(parseInt(color_strength[0]),parseInt(color_strength[1]),parseInt(color_strength[2]))
                else
                    fill(209)
                // noStroke();
                //drawing the rectangle
                rect(i * BOX_WIDTH * 2+40, j * BOX_HEIGHT * 2+10, BOX_WIDTH * 2, BOX_HEIGHT * 2)

            }

        }
    });
    myPlot.on('plotly_unhover', function(data){
        var pointId = data.points[0].x;
        scatterplot.select(".text"+ pointId).style("font-size", "6px").style("opacity",1);
        scatterplot.select(".imagee"+ pointId).attr("width", 6)
            .attr("height", 6);
    });
}

function draw_radar_chart_comparision(dataset) {
    var nearest_neigbor = math.min(dataset.distance_array);
    var get_id_label = dataset.distance_array.indexOf(nearest_neigbor);
    data = [
        {
            type: 'scatterpolar',
            r: dataset,
            // theta: array_label_string,
            fill: 'toself',
            name: dataset.label
        },
        {
            type: 'scatterpolar',
            r: store_process_tsne_data[dataset.id_array[get_id_label]],
            // theta: array_label_string,
            fill: 'toself',
            name: dataset.label_array[get_id_label]
        }
    ]

    layout = {
        polar: {

            radialaxis: {
                visible: true,
                range: [math.min(dataset), math.max(dataset)],

            },
            angularaxis: {
                start_angle: 0,
                direction: "clockwise",
                showticklabels: false,
                ticks: ''
            }

        },
        showlegend: true,
        margin: {
            l: 20,
            t: 0
        },
        legend: {
            x: 0.2,
            xanchor: 'center',
            y: 1.1
        },
        width: 300,
        autosize: true
    }
    var config = {responsive: true}
    Plotly.newPlot("radar_chart", data, layout, config);

}

//function to process the origin_data to self_similarity data by comparing euclidean distance of every pair of data point
function predata_copy(origin_data) {
    // console.log('pre')
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
            data2.push(math.multiply(normalized_data[i], normalized_data[j]) / (math.norm(normalized_data[i]) * math.norm(normalized_data[j])));
        }
        self_similarity_data.push(data2);
    }

    return self_similarity_data;
}

function reset_variable() {
    tsne_worker.terminate();
    tsne_worker = new Worker('new_tsne_worker.js');
    store_process_tsne_data = [];
    audio_label = [];
    fileContent = [];
    predict_array = [];
    store_image_in_canvas = [];
    fakeDataforfirstplot = [];
    mfcc_data_all = [];
    firstRun = true;
    firstdraw = true;
    count_done = 1;
    svg_scatterplot.selectAll("text").remove();
    svg_scatterplot.selectAll("image").remove();
    svg_scatterplot.selectAll("path").remove();
}
function pca_calculation(){
  const { PCA } = ml.decomposition;
  const pca = new PCA();
  var process_data = [];
  pca.fit(store_process_tsne_data);
  var component = pca.components;
  for (var i=0; i < store_process_tsne_data.length; i++){
      process_data.push([math.dot(store_process_tsne_data[i],component[0]),math.dot(store_process_tsne_data[i],component[1])])
  }
  // var process_data = _.unzip(component);
  // var reduce_dimensional = _.unzip([process_data[0], process_data[1]]);
  draw_feature(process_data);
}

function apply_label_after_predict(){

    if(count_click % 2 == 0){
        store_process_tsne_data.forEach((d,i)=> d.label = predict_array[i]);
        selection.exit().remove();
        scatterplot.selectAll('text').remove();
        selection.enter().append("text")
            .text(function (d) {
                return d.label;
            })
            .attr("class", (d) => "text" + d.id)
            .attr("x", function (d) {return xScale(d.x) })
            .attr("y", function (d) {return yScale(d.y) })
            .style("text-anchor", "middle")
            .style("font-size", "6px");
    }
    else{
        store_process_tsne_data.forEach((d,i)=> d.label = audio_label[i]);
        selection.exit().remove();
        scatterplot.selectAll('text').remove();
        selection.enter().append("text")
            .text(function (d) {
                return d.label;
            })
            .attr("class", (d) => "text" + d.id)
            .attr("x", function (d) {return xScale(d.x) })
            .attr("y", function (d) {return yScale(d.y) })
            .style("text-anchor", "middle")
            .style("font-size", "6px");
    }
    ++count_click;
    console.log(count_click);
}