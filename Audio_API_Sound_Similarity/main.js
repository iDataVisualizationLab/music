// setup init variables
var featureType = 'mfcc';
var featureType2 = 'rms';
var origin_data1 = [];
var total_origin_data=[];
var total_self_similarity_data = [];
var stopworker=false;
var control=false;
var audio_statistic = [];
var all_canvas_image = [];
var audio_label = [];
var image_url=[];
var record = false;
var draw_audio_canvas=[];
var draw_total_audio_canvas=[];
var color_scale = ['#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];

// setup init variables
var DEFAULT_MFCC_VALUE = [0,0,0,0,0,0,0,0,0,0,0,0,0];
var THRESHOLD_RMS = 0.002; // threshold on rms value
var MFCC_HISTORY_MAX_LENGTH = 84;

var BOX_WIDTH = 5;
var BOX_HEIGHT = 5;
var silence = true;

var cur_mfcc = DEFAULT_MFCC_VALUE;
var cur_rms = 0;
var mfcc_history = [];
var mfcc_test = [];
var fileContent = [];

//get file directory
window.onload = function () {
    //Load the sound sample then get the sound label
    d3.select("#loader").style("display", "none");
    document.getElementById("filepicker").addEventListener("change", function (event) {
        audio_label = [];
        let files = event.target.files;
        fileContent = [];
        for (i = 0; i < files.length; i++) {
            audio_label.push(files[i].name.split('_').slice(0, 2).join("_"));
            fileContent.push(URL.createObjectURL(files[i]));
        }
        getData(fileContent[0], 0);
    }, false);

}

function getData(a, index) {

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
            if (duration1 > parseInt($('#duration').val(), 10)) {
                fileContent.splice(index, 1)
                audio_label.splice(index, 1)
                if (index == fileContent.length) {
                    var index1 = 0

                } else {
                    getData(fileContent[index], index)
                }
            } else {
                //create offline audio context to render the decoding audio data then use the offline audio context and another audio buffer source node as inputs to Meyda Analyzer
                var offlineCtx = new OfflineAudioContext(1, 44100 * duration1, 44100);
                //create buffer source node which is used in Meyda Analyzer
                var source11 = offlineCtx.createBufferSource();
                //store the audio data to the buffer source node again
                source11.buffer = buffer;
                //connect the source node to offline audio context then go to Meyda Analyzer
                source11.connect(offlineCtx.destination);
                //start the buffer source node
                source11.start();
                var windowsize = 4096;
                //Create Meyda analyzer and set up the parameter
                meydaAnalyzer1 = Meyda.createMeydaAnalyzer({
                    'audioContext': offlineCtx,
                    'source': source11,
                    'melBands': 26,
                    'sampleRate': 44100,
                    'bufferSize': windowsize,
                    'hopSize': windowsize / (parseInt($('#duration').val(), 10) / duration1),
                    'numberOfMFCCCoefficients': 20,
                    'featureExtractors': [featureType, featureType2],
                    'callback': show1
                });
                //start Meyda Analyzer
                meydaAnalyzer1.start();
                var hop = Meyda.hopSize;
                var buf = Meyda.bufferSize;
                var dur = duration1;
                audio_statistic.push({duration: dur, bufferSize: buf, hopSize: hop})
                //Using offline audio context to render audio data
                offlineCtx.startRendering();
                //After complete rendering, performing the following steps
                offlineCtx.oncomplete = function (e) {
                    //copy the data generated from Meyda Analyzer 1
                    var matrix1 = [];
                    var mean_data=[];
                    //origin_data1 is generated from function show1 of Meyda Analyzer 1
                    var matrix1 = origin_data1;
                    total_origin_data.push(origin_data1)
                    //Create self_similarity data based on origin_data by calculate Euclidean distance between each pair of data point of origin_data
                    ++index;
                    console.log("loading"+index)
                    if (index < fileContent.length) {
                        origin_data1 = [];
                        getData(fileContent[index], index)

                    } else if (index == fileContent.length) {
                        d3.select("#loader").style("display", "none");
                        var index1 = 0;
                        var canvasId="myCanvas";
                        var tsne_data = tsne_prep();
                        calculate_tsne(tsne_data);
                        draw_canvas_self_similarity_matrix(total_origin_data,canvasId);
                        d3.select("#myCanvas").style("visibility","hidden");
                        if(record==false){
                            $("canvas#compareCanvas").remove();
                        }
                        $.notify("Audio Loading Completed", "success");
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

//live audio recording, create microphone audio input source from audio context
function createMicSrcFrom(audioCtx){
    record=true;
    /* get microphone access */
    return new Promise((resolve, reject)=>{
        /* only audio */
        let constraints = {audio:true, video:false}

        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream)=>{
                window.streamReference = stream;
                /* create source from
                microphone input stream */
                let src = audioCtx.createMediaStreamSource(stream);
                resolve(src);
            }).catch((err)=>{reject(err)})
    })

}

function stopStream() {
    analyzer.stop();
    if (!window.streamReference) return;
    window.streamReference.getAudioTracks().forEach(function(track) {
        track.stop();
    });
    window.streamReference = null;
}

function onMicDataCall(features, callback){
    return new Promise((resolve, reject)=>{
        var audioCtx = new AudioContext();
        createMicSrcFrom(audioCtx)
            .then((src) => {
                analyzer = Meyda.createMeydaAnalyzer({
                    'audioContext': audioCtx,
                    'source':src,
                    'bufferSize':1024,
                    'melBands': 26,
                    'sampleRate': 44100,
                    'hopSize': 1024,
                    'featureExtractors':features,
                    'callback':callback
                })
                resolve(analyzer)
            }).catch((err)=>{
            reject(err)
        })
    })
}

function setup() {
// canvas setup

        var live_canvas=createCanvas(MFCC_HISTORY_MAX_LENGTH*BOX_WIDTH*4.0, 26*BOX_HEIGHT);
        live_canvas.parent('live_canvas');
    background(220, 220, 220);

}

function startrecord() {
    $.notify("Loading Record 1", "success");
    loop();
    mfcc_history=[];
        //create meyda analyzer and connect to mic source
        onMicDataCall([featureType, featureType2], show)
            .then((meydaAnalyzer) => {
                meydaAnalyzer.start()
            }).catch((err)=>{
            alert(err)
        })
    record = true;
}

function show(features){
    // update spectral data size
    cur_mfcc = features[featureType];
    cur_rms = features[featureType2];
    //append new mfcc values
    if (cur_rms > THRESHOLD_RMS) {
        mfcc_history.push(cur_mfcc);
        mfcc_test.push(cur_mfcc);
        if (mfcc_test.length % 20 == 0) {
            total_origin_data.push(mfcc_test);
            mfcc_test = [];
        }
        draw_audio_canvas.push(cur_mfcc)
        if(total_origin_data.length==parseInt($('#duration').val(), 10)){
            // noLoop();
            //recording live sound
            record = true;
            //create canvas for sound self similarity matrix image
            var canvasId="myCanvas";
            var canvascompareId="compareCanvas";
            //stop stream when data length is matched
            // stopStream();
            var tsne_data = tsne_prep();
            calculate_tsne(tsne_data);
            draw_canvas_self_similarity_matrix(total_origin_data,canvasId);
            d3.select("#compareCanvas").style("visibility","hidden");
            total_origin_data=[];
            total_self_similarity_data=[];
            draw_total_audio_canvas.push(draw_audio_canvas);
            $.notify("Loading Record 2", "success");
            if(draw_total_audio_canvas.length==2) {

                stopStream();
                draw_canvas_self_similarity_matrix(draw_total_audio_canvas, canvascompareId);
                //prepare data for SmithWaterman Algorithm
                var smith_data =comparescore_SmithWaterman(draw_total_audio_canvas[0],draw_total_audio_canvas[1]);
                var score = SmithWaterman(smith_data[0],smith_data[1]);
                d3.select("#compareCanvas").style("visibility","visible");
                d3.select("#score")
                    .html(("Smithwaterman's Score:"+score.toFixed(2)));

                d3.select("#myCanvas").style("visibility","hidden");
                draw_total_audio_canvas=[];
            }



            draw_audio_canvas=[];

        }
    }
    // only store the last n
    if(mfcc_history.length > MFCC_HISTORY_MAX_LENGTH*3.7/2) {
        mfcc_history.splice(0, 1);
    }
}

function draw(data) {
    clear()
    background(220, 220, 220);
    // if(data==undefined){
    //     noLoop();
    // }
    // else {

        plot(mfcc_test);
    // }

}

// function draw(){
//     clear()
//     background(220, 220, 220);
//     plot(mfcc_test);
// }

function plot(data){
    for(let i = 0; i < data.length; i++ ) {
        for(let j = 0; j < data [i].length; j++ ) {
            let color_strength = data[i][j] * 100

            // setting color
            if ( data [i] [j] >= 0 )
                fill ( 0, color_strength, 0 )
            else
                fill( 0, 0, - color_strength )
            // noStroke();
            //drawing the rectangle
            rect(i * BOX_WIDTH*2, j * BOX_HEIGHT*2, BOX_WIDTH*2, BOX_HEIGHT*2)
        }
    }
}

function data_preprocess(origin_data){
    if (origin_data.length%2!=0) {
        origin_data=origin_data.slice(0,origin_data.length-1)
    }
    function scale(data){
        var scale1=d3.scaleLinear().domain([math.min(total_origin_data),math.max(total_origin_data)]).range([0,1])
        var scale_data=[]
        data.forEach(d=>scale_data.push(scale1(d)))
        return scale_data
    }
    const reducer = (accumulator, currentValue) => math.add(accumulator, currentValue);
    var mean = [];
    var standardeviation = [];
    var mean_std = [];
    var difference1 = [];
    var difference2 = [];
    var t_sne_data = [];
    var t_sne_data_extra = [];
    var origin_data_unzip = []
    origin_data_unzip = _.unzip(origin_data);
    origin_data_unzip.forEach(function (d) {
        // mean.push(math.mean(scale(d)));
        mean.push(math.mean(d))
        standardeviation.push(math.std(d))
    })
    var std_difference1=[];
    var std_difference2=[];
    var length=origin_data.length/2;
    for (i=0; i< origin_data_unzip.length; i++) {
        for (k = 0; k < origin_data_unzip[0].length; k += 2) {
            std_difference1.push(math.subtract(origin_data_unzip[i][k+1],origin_data_unzip[i][k]))
        }
        std_difference2.push(math.std(std_difference1));
        // console.log(std_difference2)
    }
    mean_std=scale(mean).concat(scale(standardeviation))
    for (i = 0; i < origin_data.length; i += 2) {
        difference1.push(nj.subtract(origin_data[i+1], origin_data[i]).tolist());
    }
    difference2 = difference1.reduce(reducer)

    t_sne_data_extra=mean_std.concat(scale(math.divide(difference2,length)));

    return t_sne_data_extra
}

//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function show1(features) {
    var mfcc = features[featureType];
    var rms = features[featureType2];
    if (rms != 0) {
        origin_data1.push(mfcc)
    }
}

//function to process the origin_data to self_similarity data by comparing euclidean distance of every pair of data point
function predata(origin_data, index) {
    console.log('pre')
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
    self_similarity_data.index = index;
    total_self_similarity_data.push(self_similarity_data)
    return self_similarity_data;
}

function euclideanDistance(a, b) {
    var sum = 0;
    if (a.length == b.length) {

        sum = distance(a, b);
        //if 2 vector does not have the same data length, fill 0 to the rest of smaller dimension vector
    } else if (a.length < b.length) {
        a = a.concat(Array(b.length - a.length).fill(0))
        sum = distance(a, b);

    } else {
        b = b.concat(Array(a.length - b.length).fill(0))

        sum = distance(a, b)

    }
    return sum
}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function drawmatrix(self_similarity_data, index1, canvasId) {
    console.log('draw')
    var canvas="compareCanvas";
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
    console.log(color_data);
    var c = document.getElementById("myCanvas");
    var c1 = document.getElementById("compareCanvas");
    if(total_self_similarity_data.length>2) {
        c.width = color_data.length;
        c.height = color_data.length;
    }
    var ctx = c.getContext("2d");
    var ctx1= c1.getContext("2d");
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
    ctx1.putImageData(imgData, index1*(48*parseInt($('#duration').val(), 10)),0)
    //save canvas to png image then call back to use in network diagram
    // var imagedata = c.toDataURL("image/png").replace("image/png", "image/octet-stream");
    var imagedata = c.toDataURL("image/png");
    all_canvas_image.push(imagedata);
    ++index1;
    console.log(index1)
    if (index1 < total_self_similarity_data.length) {
        drawmatrix(total_self_similarity_data[index1], index1, canvasId);
    }
    console.log("I am calculating the distance");
}
function tsne_prep(){
    //extract the 39-feature element for each sound sample in total_origin_data;
    var total_pre_process_data=[];
    total_origin_data.forEach(d=>{
        total_pre_process_data.push(data_preprocess(d))
    });

    //scale the data in total_pre_process_data based on the min and max feature values,
    var total_pre_process_data_mean=[];
    total_pre_process_data.forEach(d=>{total_pre_process_data_mean.push(scale_mean(d))})

    function scale_mean(data){
        var scale1=d3.scaleLinear().domain([math.min(total_pre_process_data),math.max(total_pre_process_data)]).range([0,1])
        var scale_data=[]
        data.forEach(d=>scale_data.push(scale1(d)))
        return scale_data
    };
    //we used data_min as a global varialbe to store all the data to process later.
    data_min=total_pre_process_data_mean;
    store_distance=[];
    //calculate the min distance value of each sample to the others.
    data_min.forEach(d=>{
        store_distance.push(math.min(get_min_distance(d)));
        d.distancevalue=get_min_distance(d);
    })
    //only use in off-live method
    if(record!=true) {
        fileContent.forEach((d, i) => {
            data_min[i].url = d;
            data_min[i].info = audio_statistic[i];
            data_min[i].id = i;
        })
    }
    //use k-mean to define the group of sample based on color
    getcluster(data_min)
    return total_pre_process_data;
}
function calculate_tsne(data){

    // if (stopworker==true){
    //     stopWorker()
    //     stopworker=false;
    // }
    // stopworker=true;
    scatterplot.selectAll("path").remove();
    process_tsne(data);
    image_url=[];
    audio_statistic = [];
    all_canvas_image = [];
}

function process_tsne(data){

    //startWorker(total_pre_process_data,Initial_Scatterplot,getcluster)
    setTimeout(function(){
        startWorker({dataset:data,
            epsilon: 10,        // epsilon is learning rate (10 = default)
            perplexity: parseInt($('#myRange1').val(), 10),    // roughly how many neighbors each point influences (30 = default)
            tsne_iteration: parseInt($('#myRange2').val(), 10)})
    },2000);

}

//initiate scatter plot for tsne
width = 700, height = 450,
    margin = {left: 50, top: 50, right: 50, bottom: 50},
    contentWidth = width - margin.left - margin.right,
    contentHeight = height - margin.top - margin.bottom;

svg_scatterplot = d3.select("#theGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    // .attr("transform",'translate(100,200)');

scatterplot = svg_scatterplot
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.right})`)
    .attr("id", "snodes");

// Draw a scatterplot from the given t-SNE data
function Initial_Scatterplot(tsne_data) {
    UpdateDataTSNE(tsne_data);      // Update our clu with the given t-SNE data
    Draw_Scatterplot(data_min);    // Draw the scatterplot with the updated data
}

// Update the data with the given t-SNE result
function UpdateDataTSNE(data) {
    data.forEach(function(d, i) {
        data_min[i].x = d[0];  // Add the t-SNE x result to the dataset
        data_min[i].y = d[1];  // Add the t-SNE y result to the dataset
        data_min[i].label=audio_label[i];
        data_min[i].image=image_url[i];
        data_min[i].image_canvas=all_canvas_image[i];
        data_min[i].distance1=store_distance[i];
    });
}

function draw_graph()
{
    d3.selectAll("circle")
        .style("stroke", 'none');
    let graph1 = {};
    graph1.nodes = [];
    graph1.links = [];
    for ( i=0; i < data_min.length; i++) {
        graph1.nodes.push({"id": i, "links": []})
    }
    var link2=[];
    for (i = 0; i < data_min.length - 1; i++) {
        var link1 = [];
        for (j = i + 1; j < data_min.length; j++) {
            link1.push({"source": i, "target": j, "weight": euclideanDistance(data_min[i],data_min[j]),
                "connection": data_min[i].label+ " : " +data_min[j].label})
        }
        link2.push(link1)
    }

    graph1.links=d3.merge(link2)
console.log(graph1)
    //create minimumSpanningTree
       minimumSpanningTree = mst(graph1);
    store_nodes_path=[];
    minimumSpanningTree.links.forEach((d,i)=> {
        store_nodes_path.push([data_min[d.source],data_min[d.target]])
        store_nodes_path[i].value = minimumSpanningTree.links[i].weight
    })
    draw_path(store_nodes_path)
}
function draw_shortestpath(start_node_id, end_node_id){
    draw_graph();
    var node_circle=[];
    node_circle = svg_scatterplot.selectAll("image")._groups[0];
    minimumSpanningTree.links.forEach(d=>{
        minimumSpanningTree.links.push({"source":d.target,"target":d.source,"weight": d.weight})
    })
    var nodes= minimumSpanningTree.nodes;
    var links= minimumSpanningTree.links;
    console.log(minimumSpanningTree)

    function convert_graph(graph) {
        var j, k, l, len, len1, map1, n, ref;
        map1 = {};
        ref = graph.nodes;
        for (j = 0, len = ref.length; j < len; j++) {
            n = ref[j];
            for (k = 0, len1 = links.length; k < len1; k++) {
                l = links[k];
                if (n.id === l.source) {
                    if (!(n.id in map1)) {
                        map1[n.id] = {};
                    }
                    map1[n.id][l.target] = l.weight;
                }
            }
        }
        return map1;
    };

    map1 = convert_graph(minimumSpanningTree);

    var lib_graph = new Graph(map1);

    var shortest_path = lib_graph.findShortestPath(start_node_id, end_node_id);

    for (i=0;i<shortest_path.length;i++){
        shortest_path[i]=parseInt(shortest_path[i])}
    var store_nodes_shortest=[];
    shortest_path.forEach((d,i)=>{
        if (i<shortest_path.length-1) {
            store_nodes_shortest.push([data_min[shortest_path[i]], data_min[shortest_path[i + 1]]])
            store_nodes_shortest[i].value = euclideanDistance(data_min[shortest_path[i]], data_min[shortest_path[i + 1]])
        }
    })

    draw_path_only(store_nodes_shortest,900)
    var store_links=[];
    minimumSpanningTree.links.forEach(d=> {
        store_links.push(d.source,d.target)
    })
    svg_scatterplot.selectAll("image").style("opacity",function (d){
        return shortest_path.includes(d.id)?1:0;
    })
    svg_scatterplot.selectAll("text").style("opacity",function (d){
        return shortest_path.includes(d.id)?1:0;
    })
    for (var i = 0; i < shortest_path.length; i++) {
        (function (i) {
            setTimeout(function () {
                PlayAudio(node_circle[shortest_path[i]], data_min[shortest_path[i]]);
                d3.select(node_circle[shortest_path[i]])
                // Does work
                    .attr("width", 60)
                    .attr("height",60)
                    .transition().duration(500)
                    .attr("width", 30)
                    .attr("height",30);

            }, 800 * (i + 1));
        })(i);
    }
}
function draw_path_only(store_nodes,time_play) {
    scatterplot.selectAll("path").style("opacity",0);
    var index;
    for (var i = 0; i < store_nodes.length; i++) {
        (function (i) {
            setTimeout(function () {
                index=store_nodes[i].value;
                store_nodes_path.forEach(d=>{
                    if(d.value==index) {
                        d3.select("#line" + store_nodes_path.indexOf(d)).style("opacity", 1)
                    }
                })

            }, time_play * (i + 1));
        })(i);


    }
}
function draw_path(store_nodes) {
    scatterplot.selectAll("path").remove();
    scatterplot.selectAll(".compute").remove();
    svg_scatterplot.selectAll("image").remove();
    svg_scatterplot.selectAll("image").style("opacity",1);

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
    const l = length(valueline(data_min));
    for (var i = 0; i < store_nodes.length; i++) {
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
    }
    var nested_data = d3.nest()
        .key(function(d) { return d.weight; })
        .entries(minimumSpanningTree.links);
    Update_Nodes(nested_data)
}
function Update_Tsne_node(data) {
    const selection = scatterplot.selectAll(".compute").data(data);
    //Exit
    selection.exit().remove();
    //Enter
    const newElements = selection.enter().append('svg:image')
        .attr('xlink:href', function (d) {
            return d.image_canvas;
        })
        .attr('x', function (d) {
            return (xScale(d.x)-30);
        })
        .attr('y', function (d) {
            return (yScale(d.y)-20);
        })
        .attr("class", "compute")
        // .attr("class",function(d,i){
        //     return "image_node"+i})
        .attr('width', 30)
        .attr('height', 30);



    //Update
    selection
        .attr("x", d => (xScale(d.x)-30))
        .attr("y", d=> (yScale(d.y)-20))
        // .attr("y", d => (yScale(d.y)-20));
}
function Update_Nodes(nested_data){
    var start_node_id;
    var end_node_id;
    var selected_node=false;
    var active_value;

    selection = scatterplot.selectAll(".image_node").data(data_min);
    svg_scatterplot.append("g")
        .attr("class", "rowLabels")
        .selectAll(".rowLabel")
        .data(data_min)
        .enter().append("text")
        .text(function (rowLabel) {
            return rowLabel.label;
        })
        .attr("class",function (d,i) {
            return "text"+i
        })
        .attr("x", function (d) {return xScale(d.x)-30 })
        .attr("y", function (d) {return yScale(d.y)-30 })
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .attr("transform", function (rowLabel) {
            return `translate(80, ${60})`;
        })
        // .style("opacity",0);
    selection.enter().append('svg:image')
        .attr('xlink:href', function (d) {
            return d.image_canvas;
        })
        .attr('x', function (d) {
            return (xScale(d.x)-30);
        })
        .attr('y', function (d) {
            return (yScale(d.y)-20);
        })
        .attr("class",function(d,i){
            return "image_node"+i})
        .attr('width', 30)
        .attr('height', 30)
        .on("click", function (d) {
            svg_scatterplot.selectAll("text").style("opacity",1)
            active_value = d.id;
            if (selected_node == false) {
                minimumSpanningTree.nodes[d.id].start = true;
                start_node_id = d.id
                $.notify("Start Node Selected", "success");
                selected_node = true;
                svg_scatterplot.selectAll('image')
                    .style('opacity', function (d) {
                        return d.id == active_value ? 1 : 0.5;
                    })
            } else {
                minimumSpanningTree.nodes[d.id].end = true;
                $.notify("End Node Selected", "success");
                end_node_id = d.id;
                selected_node = false;
                draw_shortestpath(start_node_id,end_node_id)

            }
        })
        .on("mouseover", function (d) {
            svg_scatterplot.selectAll("text").style("opacity",1);
            svg_scatterplot.selectAll("image").style("opacity",1);
            active_value = d.id;
            console.log(active_value);
            PlayAudio(this, d);
            noLoop();
            for(let i = 0; i < total_origin_data[d.id].length; i++ ) {
                for(let j = 0; j < total_origin_data[d.id][i].length; j++ ) {
                    let color_strength = total_origin_data[d.id][i][j] * 100

                    // setting color
                    if ( total_origin_data[d.id] [i] [j] >= 0 )
                        fill ( 0, color_strength, 0 )
                    else
                        fill( 0, 0, - color_strength )
                    // noStroke();
                    //drawing the rectangle
                    rect(i * BOX_WIDTH*2, j * BOX_HEIGHT*2, BOX_WIDTH*2, BOX_HEIGHT*2)
                }
            }
            d3.select(this)
                .attr("width", 60)
                .attr("height", 60)
            scatterplot.selectAll("path")
                .style('stroke-width', function (d) {
                    return (d[0].id == active_value || d[1].id == active_value) ? 5 : 1;
                })
                .style("opacity", function (d) {
                    return (d[0].id == active_value || d[1].id == active_value) ? 0.5 : 1;
                })

            nested_data.forEach(d1=>{
                    if(d1.key==d.distance1){
                        d1.values.forEach(d2=> {
                            d3.select(".image_node" + d2.source).attr("width", 60).attr("height", 60)
                                .transition().duration(200).attr("width", 30).attr("height", 30)
                            d3.select(".image_node" + d2.target).attr("width", 60).attr("height", 60)
                                .transition().duration(200).attr("width", 30).attr("height", 30)
                            svg_scatterplot.selectAll("text").style("opacity",function (d3){
                                return d3.id==d2.target||d3.id==d2.source?1:0;
                            })
                        })
                    }
                }
            )
            MouseOvertooltip(d,active_value);
            d3.select('#tooltip_all')
                .style("visibility","visible");

        })
        .on("mouseout", function (d){
            svg_scatterplot.selectAll("text").style("opacity",1);
            scatterplot.selectAll("path")
                .style('stroke-width', 1);
            // div.style("opacity", 0);
            d3.selectAll('image')
                .attr("width", 30)
                .attr("height", 30);

        });
}

function reset(){
    stopWorker()
}

function stopWorker() {
    w.terminate();
    w = undefined;
}

// Draw a scatterplot from the given data
function Draw_Scatterplot(data){

     xScale = d3.scaleLinear()
        .domain(getExtent(data, "x"))
        .range([0, contentWidth]);
     yScale = d3.scaleLinear()
        .domain(getExtent(data, "y"))
        .range([0, contentHeight]);
     Update_Tsne_node(data)

}

function getExtent(data, key) {
    return d3.extent(data.map(d => d[key]));
}

function MouseOvertooltip(d, active_value) {
    $("#tooltip_line").empty();
    $("canvas#tooltip_radar_compare").remove();
    plot_line_v4(d)
    plot_radar(d,d.group)
}

//Get a set of cluster centroids based on the given data
function getcluster(data){
    let clusterSet = [];
    let centroids = [];

    //give number of clusters we want
    clusters.k(7);

    //number of iterations (higher number gives more time to converge), defaults to 1000
    clusters.iterations(750);

    //data from which to identify clusters, defaults to []
    clusters.data(data);

    clusterSet = clusters.clusters();
    for (i=0; i<clusterSet.length;i++){
        for (j=0; j<data_min.length; j++) {
            clusterSet[i].points.includes(data_min[j]) ? data_min[j].group=i:0;
        }
    }
}

function calculate_Euclidean() {

    var totalscore = [];
    for (i = 0; i < total_self_similarity_data.length - 1; i++) {
        var scorefinal = [];
        for (j = i + 1; j < total_self_similarity_data.length; j++) {
            //Calculate distance based on Euclidean Distance
            scorefinal.push(comparescore_Euclidean(total_self_similarity_data[i], total_self_similarity_data[j]))
        }
        totalscore.push(scorefinal)
    }

}

function PlayAudio(thisElement, d) {
    // Play audio on click
    let audioElement;
    if (thisElement.getElementsByTagName("audio").length === 0) {

        // Create audio object from source url
        audioElement = new Audio(d.url);
        // Preload audio to improve response times
        audioElement.preload = "auto";
        // Cache audio for later use to improve performance
        thisElement.appendChild(audioElement);
        // Play the audio
        audioElement.play();
    }
     else {
        // Get saved audio element
        audioElement = thisElement.getElementsByTagName("audio")[0];
        if (audioElement.isPlaying()) {
            // Pause if it is playing
            audioElement.stop();
        } else {
            // Play if not already playing
            audioElement.play();
        }
    }
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

function get_min_distance(data){
    distance3=[];
    var distance2=[];
    data_min.forEach(d=> {
        if (d!=data){
        distance2.push(euclideanDistance(data,d))
}
})
    distance3.push(distance2)
    return distance2;
}

function plot_radar(given_data,group) {
    var N = 39;
    var array_label=[];
    array_label=Array.apply(null, {length: N}).map(Number.call, Number)
    var marksCanvas = document.getElementById("marksChart");
    var marksData = {
        labels: array_label,
        datasets: [{
            label: given_data.id,
            pointHoverRadius: 2,
            radius:2,
            pointRadius: 1,
            pointBorderWidth: 2,
            borderColor: hexToRgbA(color_scale[group]),
            data: given_data
        }]
    };


    var options = {
        title: {
            display: true,
            fontSize: 50,
            text: given_data.label
        },
        responsive: true,
        maintainAspectRatio: false,
        scale: {
            ticks: {
                beginAtZero: true,
                min: math.min(data_min),
                max: math.max(data_min),
                stepSize: 0.02
            },

        },
        pointLabels: {
            fontSize: 10
        }
        ,
        legend: false,


        animation: {
            onComplete: done

        },
        tooltips: {
            mode: 'index',
            intersect: false
        },
        hover: {
            mode: 'index',
            intersect: false
        },

    };
    function done(){
        var image_store=[];
        image_url.push(radarChart.toBase64Image());
        image_store=radarChart.toBase64Image();
        given_data.image=image_store;
    }
    $("canvas#tooltip_radar").remove();
    $("#tooltip_all").append('<canvas id="tooltip_radar" width="200" height="200"></canvas>');
    var ctx=document.getElementById("tooltip_radar").getContext("2d");
    var radarChart = new Chart(ctx, {
        type: 'radar',
        data: marksData,
        options:options
    });

}
function plot_radar_compare(given_data,group) {
    var N = 39;
    var array_label=[];
    array_label=Array.apply(null, {length: N}).map(Number.call, Number)
    var marksCanvas = document.getElementById("marksChart1");

    var marksData = {
        labels: array_label,
        datasets: [{
            label: given_data.id,
            pointHoverRadius: 2,
            radius:2,
            pointRadius: 1,
            pointBorderWidth: 2,
            borderColor: hexToRgbA(color_scale[group]),
            data: given_data
        }]
    };


    var options = {
        title: {
            fontSize: 50,
            display: true,
            text: given_data.label
        },
        responsive: true,
        maintainAspectRatio: false,
        scale: {
            ticks: {
                beginAtZero: true,
                min: math.min(data_min),
                max: math.max(data_min),
                stepSize: 0.02
            },

        },
        pointLabels: {
            fontSize: 10
        }
        ,
        legend: false,

        animation: {
            onComplete: done

        },
        tooltips: {
            mode: 'index',
            intersect: false
        },
        hover: {
            mode: 'index',
            intersect: false
        },

    };
    function done(){
        var image_store=[];
        image_url.push(radarChart.toBase64Image());
        image_store=radarChart.toBase64Image();
        given_data.image=image_store;
    }
    $("canvas#tooltip_radar_compare").remove();
    $("#tooltip_all").append('<canvas id="tooltip_radar_compare" width="200" height="200"></canvas>');
    var ctx=document.getElementById("tooltip_radar_compare").getContext("2d");
    var radarChart = new Chart(ctx, {
        type: 'radar',
        data: marksData,
        options:options
    });

}
function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
    }
    throw new Error('Bad Hex');
}

function plot_line_v4(data) {
       if (control== false) {
              var array_label=create_label(data)
              var svg = d3.select("#tooltip_line")
                      .append("svg")
                      .attr("width", 500)
                      .attr("height", 300)
                      .attr("transform", 'translate(0,0)'),
                  margin = {top: 20, right: 20, bottom: 30, left: 40},
                  width = +svg.attr("width") - margin.left - margin.right,
                  height = +svg.attr("height") - margin.top - margin.bottom,
                  contentWidth = width - margin.left - margin.right,
                  contentHeight = height - margin.top - margin.bottom;
              // //Build tooltip
              let div = d3.select("#tooltip_line").append("div").attr("class", "tooltip_label").attr("opacity", 0);

              //Build the xAsis
              const xAxisG = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top + contentHeight})`);
              const xScale = d3.scaleLinear().domain(d3.extent(array_label)).range([0, contentWidth]);
              const xAxis = d3.axisBottom(xScale).tickFormat("").ticks(data.distancevalue.length)
              xAxisG.call(xAxis);

              const yAxisG = svg.append('g').attr("transform", `translate(${margin.left}, ${margin.top})`);
              const yScale = d3.scaleLinear().domain([0, math.max(data.distancevalue)]).range([contentHeight, 0]);
              const yAxis = d3.axisLeft(yScale);
              yAxisG.call(yAxis);

              const graph = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
              const lineGen = d3.line().x(function (d, i) {
                  return xScale(array_label[i])
              }).y(d => yScale(d));
              const linePath = graph.append("path").datum(data.distancevalue).attr("d", lineGen).attr("fill", "none").attr("stroke", "black");
              let circles = graph.selectAll("circle").data(data.distancevalue).enter().append("circle").call(createCircle);

              function createCircle(theCircle) {
                  return theCircle.attr("cx", function (d, i) {
                      return xScale(array_label[i])
                  })
                      .attr("cy", d => yScale(d))
                      .attr("r", function (d){
                          if (d==math.min(data.distancevalue)){
                              return 6
                          }
                          else {
                              return 2
                          }
                      })
                      .style("fill", function (d,i){
                        return color_scale[data_min[array_label[i]].group]
                      })
              .on("mouseover", (d,i) => {
                      div.style('left', d3.event.pageX + "px").style("top", (d3.event.pageY-100) + "px");
                      div.style("opacity", 1);
                      div.html("Source: " + data.label + "</br>" +"Target: " + data_min[array_label[i]].label + "</br>" + "Distance: " + d.toFixed(4) + "</br>");
                  plot_radar_compare(data_min[array_label[i]],data_min[array_label[i]].group);

                  })
                      .on("mouseout", d=>{
                          div.transition().style("opacity", 0);
                      });

              }

          }

}

function create_label(data){
    var N = data_min.length;
    var array_label = [];
    array_label = Array.apply(null, {length: N}).map(Number.call, Number)
    var index = array_label.indexOf(data.id);
    array_label.splice(index, 1);
    return array_label
}

function draw_canvas_self_similarity_matrix(origin_data, canvasId){

        for (var i = 0; i < origin_data.length; i++) {
            predata(origin_data[i], i);
        }

    var index1 = 0
        //draw self_similarity matrix1
        drawmatrix(total_self_similarity_data[index1], index1, canvasId);

}

