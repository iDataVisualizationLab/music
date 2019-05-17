// setup init variables
var mfcc = [];
var rms = 0;
var featureType = 'mfcc';
var featureType2 = 'rms';
var origin_data1 = [];
var total_origin_data=[];
var total_self_similarity_data = [];
var durations=4;
var perplexity_value;
var iterations_value;
var start_node_id;
var end_node_id;
var stopworker=false;
var control=false;
var audio_statistic = [];
var all_canvas_image = [];
var audio_label = [];
var image_url=[];


//get file directory
window.onload = function () {

    d3.select("#loader").style("display", "none");
    document.getElementById("filepicker").addEventListener("change", function (event) {
        audio_label = [];
        let files = event.target.files;
        fileContent = [];
        for (i = 0; i < files.length; i++) {
            audio_label.push(files[i].name.split('_').slice(0,2).join("_"))
            fileContent.push(URL.createObjectURL(files[i]));
        }
        getData(fileContent[0], 0)

    }, false);


    var get_durations = document.getElementById("duration")
    get_durations.onchange = function () {
        durations=parseInt(this.value)
        console.log(durations)
    }
    var perplexity = document.getElementById("myRange1");
    var iterations = document.getElementById("myRange2");
    var output_perplexity = document.getElementById("perplexity_output");
    var output_iterations = document.getElementById("iteration_output");
    perplexity_value=perplexity.value;
    iterations_value=iterations.value

    perplexity.oninput = function() {
        output_perplexity.value= this.value;
        perplexity_value = this.value;
    }

    iterations.oninput = function() {
        output_iterations.value = this.value;
        iterations_value = this.value;
    }

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
            if (duration1 > durations) {
                fileContent.splice(index, 1)
                audio_label.splice(index, 1)
                if (index == fileContent.length) {
                    var index1 = 0
                    //draw self_similarity matrix1
                    // drawmatrix(total_self_similarity_data[index1], index1);
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
                    'hopSize': windowsize / (durations / duration1),
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
                    // var matrix11 = [];
                    // var matrix11 = predata(matrix1, index);
                    ++index;
                    console.log("loading"+index)
                    if (index < fileContent.length) {
                        origin_data1 = [];
                        getData(fileContent[index], index)
                    } else if (index == fileContent.length) {
                        d3.select("#loader").style("display", "none");
                        var index1 = 0
                        //draw self_similarity matrix1
                        // drawmatrix(total_self_similarity_data[index1], index1);
                        calculate_tsne()
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

    return mean
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
            // data2.push(euclideanDistance(normalized_data[i], normalized_data[j]))
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

function calculate_tsne(){
    if (stopworker==true){
        stopWorker()
        stopworker=false;
    }
    stopworker=true;
    scatterplot.selectAll("path").remove();
    var total_pre_process_data=[];
    total_origin_data.forEach(d=>{
        total_pre_process_data.push(data_preprocess(d))
    });

    var total_pre_process_data_mean=[];
    total_pre_process_data.forEach(d=>{total_pre_process_data_mean.push(scale_mean(d))})

    function scale_mean(data){
        var scale1=d3.scaleLinear().domain([math.min(total_pre_process_data),math.max(total_pre_process_data)]).range([0,1])
        var scale_data=[]
        data.forEach(d=>scale_data.push(scale1(d)))
        return scale_data
    }
    // data_min=total_pre_process_data;
    data_min=total_pre_process_data_mean
     store_distance=[];
    data_min.forEach(d=>{
        store_distance.push(math.min(get_min_distance(d)));
        d.distancevalue=get_min_distance(d)
    })

    fileContent.forEach((d,i)=>{

        data_min[i].url=d;
        data_min[i].info=audio_statistic[i];
        data_min[i].id=i;
    })
    getcluster(data_min)
    process_chart()
    for (var i=0;i<data_min.length;i++) {
        draw_radar_chart(data_min[i],data_min[i].group)
    }

     function process_chart(){
        // if (i==data_min.length-1){
        //     console.log("heheheheh")

        //     // startWorker(total_pre_process_data,Initial_Scatterplot,getcluster)
            setTimeout(function(){
                startWorker({dataset:total_pre_process_data,
                epsilon: 10,        // epsilon is learning rate (10 = default)
                perplexity: perplexity_value,    // roughly how many neighbors each point influences (30 = default)
                iterations: iterations_value})
            },2000);

    }
    // draw_radar_chart(data_min[i])
    image_url=[];
    // total_origin_data=[];
    audio_statistic = [];
    all_canvas_image = [];
    total_self_similarity_data = [];
}

//initiate scatter plot for tsne
width = 700, height = 450,
    margin = {left: 50, top: 50, right: 50, bottom: 50},
    contentWidth = width - margin.left - margin.right,
    contentHeight = height - margin.top - margin.bottom;

svg_scatterplot = d3.select("#theGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("transform",'translate(100,-30)');

scatterplot = svg_scatterplot
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.right})`)
    .attr("id", "snodes");

// var div = d3.select("body").append("div")
//     .attr("class", "tooltip_circle")
//     .style("opacity", 0);



// Draw a scatterplot from the given t-SNE data
function Initial_Scatterplot(tsne_data) {
    UpdateDataTSNE(tsne_data);      // Update our clu with the given t-SNE data
    _Draw_Scatterplot(data_min);    // Draw the scatterplot with the updated data
}

// Update the data with the given t-SNE result
function UpdateDataTSNE(data) {
    data.forEach(function(d, i) {
        data_min[i].x = d[0];  // Add the t-SNE x result to the dataset
        data_min[i].y = d[1];  // Add the t-SNE y result to the dataset
        data_min[i].label=audio_label[i];
        data_min[i].image=image_url[i];
        data_min[i].distance1=store_distance[i];
    });
}

function playmusic(){
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

    //create minimumSpanningTree
       minimumSpanningTree = mst(graph1);
    store_nodes_path=[];
    minimumSpanningTree.links.forEach((d,i)=> {
        store_nodes_path.push([data_min[d.source],data_min[d.target]])
        store_nodes_path[i].value = minimumSpanningTree.links[i].weight
    })
    draw_path(store_nodes_path,100)
}
function draw_shortestpath(){
    var node_circle=[];
    node_circle = svg_scatterplot.selectAll("image")._groups[0];
    minimumSpanningTree.links.forEach(d=>{
        minimumSpanningTree.links.push({"source":d.target,"target":d.source,"weight": d.weight})
    })
    var nodes= minimumSpanningTree.nodes;
    var links= minimumSpanningTree.links;
    console.log(minimumSpanningTree)

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

    map = convert_graph(minimumSpanningTree);

    var lib_graph = new Graph(map);
    var shortest_path = lib_graph.findShortestPath(start_node_id, end_node_id);
    console.log(shortest_path)
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
                    .attr("width", 80)
                    .attr("height",80)
                    .transition().duration(500)
                    .attr("width", 60)
                    .attr("height",60);

            }, 800 * (i + 1));
        })(i);
    }
    // svg_scatterplot.selectAll("image").style("opacity",0);
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
    var selected_node=false;
    scatterplot.selectAll("path").remove();
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
    var active_value;
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
    selection = scatterplot.selectAll(".image_node").data(data_min);
    svg_scatterplot.append("g")
        .attr("class", "rowLabels")
        .selectAll(".rowLabel")
        .data(data_min)
        .enter().append("text")
        .text(function (rowLabel) {
            return rowLabel.id
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
        .style("opacity",0);
        selection.enter().append('svg:image')
            .attr('xlink:href', function (d) {
                return d.image;
            })
            .attr('x', function (d) {
                return (xScale(d.x)-30);
            })
            .attr('y', function (d) {
                return (yScale(d.y)-20);
            })
            .attr("class",function(d,i){
                return "image_node"+i})
            .attr('width', 60)
            .attr('height', 60)
            .on("click", function (d) {
                svg_scatterplot.selectAll("text").style("opacity",0)
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
                    draw_shortestpath()

                }
            })
            .on("mouseover", function (d) {
                svg_scatterplot.selectAll("image").style("opacity",1);
                active_value = d.id;
                PlayAudio(this, d)

                d3.select(this)
                    .attr("width", 120)
                    .attr("height", 120)
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
                            d3.select(".image_node" + d2.source).attr("width", 120).attr("height", 120)
                                .transition().duration(200).attr("width", 100).attr("height", 100)
                            d3.select(".image_node" + d2.target).attr("width", 120).attr("height", 120)
                                .transition().duration(200).attr("width", 100).attr("height", 100)
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
                scatterplot.selectAll("path")
                    .style('stroke-width', 1);
                // div.style("opacity", 0);
                d3.selectAll('image')
                    .attr("width", 60)
                    .attr("height", 60);

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
function _Draw_Scatterplot(data){

     xScale = d3.scaleLinear()
        .domain(getExtent(data, "x"))
        .range([0, contentWidth]);
     yScale = d3.scaleLinear()
        .domain(getExtent(data, "y"))
        .range([0, contentHeight]);

}

function getExtent(data, key) {
    return d3.extent(data.map(d => d[key]));
}

function MouseOvertooltip(d, active_value) {
    $("#tooltip_line").empty();
    plot_line_v4(d)
    plot_radar(d,d.group)
}

// Get a set of cluster centroids based on the given data
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
function draw_radar_chart(given_data,group) {
    var set_colors;
    var color_scale = ['#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];
    var set_colors=color_scale[group];
    console.log("color:" + set_colors)
    var N = 13;
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
            borderColor: hexToRgbA(set_colors),
            data: given_data
        }]
    };


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
    var options = {
        scale: {
            ticks: {
                beginAtZero: true,
                min: math.min(data_min),
                max: math.max(data_min),
                stepSize: 0.02
            },
            display: false,
            pointLabels: {
                fontSize: 10
            }
            },
        legend: false,
        animation: {
            onComplete: done

        },
        maintainAspectRatio: false
    };
    function done(){
        var image_store=[];
        image_url.push(radarChart.toBase64Image());
        image_store=radarChart.toBase64Image();
        given_data.image=image_store;
    }

    var radarChart = new Chart(document.getElementById("marksChart").getContext("2d"), {
        type: 'radar',
        data: marksData,
        options:options
    });
}


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
    var set_colors;
    var color_scale = ['#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];
    var set_colors=color_scale[group];
    console.log("color:" + set_colors)
    var N = 13;
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
            borderColor: hexToRgbA(set_colors),
            data: given_data
        }]
    };


    var options = {
        title: {
            display: true,
            text: 'Standardized Mean Value '+ given_data.label
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
        // scale: {
        //     display:true
        // },

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
function plot_line(data){
    var set_colors;
    var color_scale = ['#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];
    var set_colors=color_scale[data.group];
    var N = data_min.length;
    var array_label=[];
    array_label=Array.apply(null, {length: N}).map(Number.call, Number)
    var index=array_label.indexOf(data.id);
    // var data_temp=data.distancevalue;
    array_label.splice(index,1)
    // data_temp.splice(index,1)
    var dataArr = data.distancevalue;
    $("canvas#tooltip_line").remove();
    $("#tooltip_all").append('<canvas id="tooltip_line" width="300" height="300"></canvas>');
    var ctx=document.getElementById("tooltip_line").getContext("2d");
    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: array_label,
            datasets: [{
                label: data.id,
                data: dataArr,
                backgroundColor: hexToRgbA(set_colors),
                borderColor: hexToRgbA(set_colors),
                fill: false,
                tension: 0
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Node:'+ data.id + '- Node:' + array_label[dataArr.indexOf(data.distance1)] + " Min:"+ data.distance1.toFixed(4)
            },
            scales: {
                yAxes: [{
                    ticks: {
                        min: Math.min.apply(this, dataArr),
                        max: Math.max.apply(this, dataArr),
                        callback: function(value, index, values) {
                            if (index === values.length - 1) return Math.min.apply(this, dataArr).toFixed(2);
                            else if (index === 0) return Math.max.apply(this, dataArr).toFixed(2);
                            else return '';
                        }
                    }
                }]
            },
            legend: false
        }
    });

}

function plot_line_v4(data) {

    // var set_colors;
    var color_scale = ['#f4429e', '#ad42f4', '#f4f142', '#ce42f4', '#f4aa42', '#42e2f4', '#42f489', '#f4f442', '#ce42f4', '#42f1f4', '#f4c542', '#f47742', '#42c5f4', '#42f4f4', '#4274f4', '#42f47d', '#eef442', '#f4c542', '#f48042'];
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
              let div = d3.select("#tooltip_line").append("div").attr("class", "tooltip").attr("opacity", 0);

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
              function tick(data1){
                  yScale.domain([0, d3.max(data1.distancevalue)]);
                  linePath.datum(data1.distancevalue).attr("d", lineGen).attr("fill", "none").attr("stroke", "black");
                  circles = graph.selectAll("circle").data(data1.distancevalue).enter().append("circle").merge(circles).call(createCircle);
                  circles.exit().remove();
                  xScale.domain(d3.extent(d3.extent(create_label(data1))));
                  xAxisG.transition().duration(1000).call(xAxis);
                  yAxisG.transition().duration(1000).call(yAxis);

              }
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
                        return color_scale[(data_min[i].group)]
                      })
              .on("mouseover", (d,i) => {
                      div.style('left', d3.event.pageX + "px").style("top", (d3.event.pageY-100) + "px");
                      div.style("opacity", 1);
                      div.html("Source: " + data.id + "</br>" +"Target: " + array_label[i] + "</br>" + "Distance: " + d.toFixed(4) + "</br>");
                  plot_radar(data_min[array_label[i]],data_min[array_label[i]].group);
                  })
                      .on("mouseout", d=>{
                          div.transition().style("opacity", 0);
                      });

              }

          }
      // else {
      //     tick(data)
      // }





}



function create_label(data){
    var N = data_min.length;
    var array_label = [];
    array_label = Array.apply(null, {length: N}).map(Number.call, Number)
    var index = array_label.indexOf(data.id);
    array_label.splice(index, 1);
    return array_label
}



