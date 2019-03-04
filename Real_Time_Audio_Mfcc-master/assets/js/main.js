// setup init variables
var mfcc = [];
var rms = 0;
var featureType = 'mfcc'
var featureType2 = 'rms'
var count = 0;
var origin_data1 = [];
var marginleft = 50;
var matrixgap = 400;
var durations = 8;
var windowsize = 2048;
var totaldata = [];
column = ["banja31", "banja32", "bass1", "bass2", "cym1", "contra11", "contra12", "contra13", "contra31", "contra32", "contrd41", "contrd42", "horn", "guia31", "guia32",
    "guid41", "guid42", "mandoa31", "mandoa32", "snare1", "snare2", "tenor", "olaa31", "olaa32", "olad41", "olad42", "olina31", "olina32", "olind41", "olind42"];


var url = ['./assets/sound/banjoa31.mp3', './assets/sound/banjoa32.mp3', './assets/sound/bassdrum1.mp3', './assets/sound/bassdrum2.mp3', './assets/sound/chinesecymball.mp3', './assets/sound/contrabassa11.mp3',
    './assets/sound/contrabassa12.mp3', './assets/sound/contrabassa13.mp3', './assets/sound/contrabassa31.mp3', './assets/sound/contrabassa32.mp3',
    './assets/sound/contrabassd41.mp3', './assets/sound/contrabassd42.mp3', './assets/sound/frenchhorna2.mp3', './assets/sound/guitara31.mp3', './assets/sound/guitara32.mp3',
    './assets/sound/guitard41.mp3', './assets/sound/guitard42.mp3', './assets/sound/mandolina31.mp3', './assets/sound/mandolina32.mp3',
    './assets/sound/snaredrum1.mp3', './assets/sound/snaredrum2.mp3', './assets/sound/tenordrum.mp3', './assets/sound/violaa31.mp3', './assets/sound/violaa32.mp3',
    './assets/sound/violad41.mp3', './assets/sound/violad42.mp3', './assets/sound/violina31.mp3', './assets/sound/violina32.mp3',
    './assets/sound/violind41.mp3', './assets/sound/violind42.mp3']

function setup() {


    getData(url[0], 0);

    function getData(a, index) {

        //Create audioContext to decode the audio data later
        var audioCtx = new AudioContext();

        //Create source as a buffer source node which contains the audio data after decoding
        var source = audioCtx.createBufferSource()

        //use XMLHttpRequest to load audio track
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
                var duration1 = 0;
                duration1 = source.buffer.duration;

                //create offline audio context to render the decoding audio data then use the offline audio context and another audio buffer source node as inputs to Meyda Analyzer
                var offlineCtx = new OfflineAudioContext(1, 44100 * duration1, 44100);

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
                    'bufferSize': windowsize,
                    'hopSize': windowsize / (durations / duration1),
                    'numberOfMFCCCoefficients': 20,
                    'featureExtractors': [featureType, featureType2],
                    'callback': show1

                })
                //start Meyda Analyzer
                meydaAnalyzer1.start();
                var hop = Meyda.hopSize;
                var buf = Meyda.bufferSize;
                var dur = duration1;

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
                    drawmatrix(matrix11, index, hop, buf, dur, url[index]);
                    ++index;
                    if (index < 30) {
                        getData(url[index], index)
                    }
                    ;
                }
            }).catch(function (err) {
                console.log('Rendering failed: ' + err);
                // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
            });
        }

        request.send();
        return 0;
    }
}


//function callback of Meyda Analyzer 1 which calculate mfcc coefficient
function show1(features) {

    mfcc = features[featureType]
    rms = features[featureType2]
    if (rms != 0) {
        origin_data1.push(mfcc)
    }
}

//the function take self_similarity data as an input and then draw the self_similarity matrix
function drawmatrix(self_similarity_data, index, hop, buffer, duration, songname) {
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
    console.log("I am calculating the distance")
    if (index == 29) {
        var totalscore = [];
        for (i = 0; i < totaldata.length - 1; i++) {
            var scorefinal = [];
            for (j = i + 1; j < totaldata.length; j++) {
                scorefinal.push(comparescore(totaldata[i], totaldata[j]))
            }
            totalscore.push(scorefinal)
        }
        chart_display(totalscore);
        network_diagram(totalscore)
    }

    //Define the position to draw self_similarity matrix on canvas
    var position = 1;
    if (index < 15) {
        ctx.putImageData(imgData, index * (matrixgap) + marginleft, 150);
    } else {
        position = position * 8;
        index = index - 15;
        ctx.putImageData(imgData, (index) * (matrixgap) + marginleft, 500)
    }

    //label the matrix by name, hopsize, buffersize, duration
    ctx.font = "20px Arial";
    ctx.fillText("Audio: " + songname, index * (matrixgap) + marginleft, 50 * position);
    ctx.fillText("Hopsize: " + hop.toFixed(0), index * (matrixgap) + marginleft, 50 * position + 30);
    ctx.fillText("Buffersize: " + buffer, index * (matrixgap) + marginleft, 50 * position + 60);
    ctx.fillText("Duration: " + duration.toFixed(2), index * (matrixgap) + marginleft, 50 * position + 90);
    console.log("I am drawing")
    //reset the origin_data from Meyda Analyzer for next use
    origin_data1 = [];
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
    totaldata.push(self_similarity_data)
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

//Create Cross similarity Matrix from 2 SSM data
function comparescore(selfmatrix1, selfmatrix2) {

    var crossscore = [];
    //get distance of all pair between each datapoint of matrix1 and matrix2
    for (var i = 0; i < selfmatrix1.length; i++) {
        var crossimilarity_matrix = [];
        for (var j = 0; j < selfmatrix2.length; j++) {
            crossimilarity_matrix.push(euclideanDistance(selfmatrix1[i], selfmatrix2[j]))
        }
        crossscore.push(crossimilarity_matrix)
    }

    //get the min distance of each pair of datapoint of matrix 1 to all datapoint of matrix 2
    var ssmcompare = [];
    for (var i = 0; i < crossscore.length; i++) {
        ssmcompare.push(math.min(crossscore[i]))

    }

    //define the distance between two matrix by get the median distance of all pair
    return math.median(ssmcompare);
}

//display matrix of distance in svg rect with bipolar color
function chart_display(datat) {
    var margin = {top: 50, right: 0, bottom: 100, left: 50}
    var width = 1000 - margin.left - margin.right;
    var height = 1000 - margin.top - margin.bottom;
    var gridSize = 20;
    var colors = colorbrewer.RdBu[9];
    var cellSize = 10
    var legendElementWidth=20

    var row = ["banja31", "banja32", "bass1", "bass2", "cym1", "contra11", "contra12", "contra13", "contra31", "contra32", "contrd41", "contrd42", "horn", "guia31", "guia32",
        "guid41", "guid42", "mandoa31", "mandoa32", "snare1", "snare2", "tenor", "olaa31", "olaa32", "olad41", "olad42", "olina31", "olina32", "olind41"];

    var label = [];
    for (i = 0; i < column.length - 1; i++) {
        var label1 = [];
        for (j = i + 1; j < column.length; j++) {
            label1.push(column[i] + ":" + column[j])
        }
        label.push(label1)
    }


    var tooltip = d3.select("#chart")
        .append("div")
        .style("position", "absolute")
        .style("visibility", "hidden");
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + 800 + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    dataset = datat;

    var scale = d3.scale.linear().domain([math.min(dataset), math.max(dataset)]).range([0, 1])
    const maxLength = d3.max(dataset.map(d => d.length));
    var colorScale = d3.scale.quantize()
        .domain([0, 1])
        .range(colors)
    var rownumber = 0;
    var draw = svg.selectAll("g")
        .data(dataset)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(${i * gridSize}, ${i * (gridSize)})`)
        .selectAll("rect")
        .data(function (d) {
            return d
        })
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
            return i * gridSize;
        })
        .attr("y", 0)
        .attr("height", 10)
        .attr("width", 10)
        .attr("transform", "translate(55,20)")
        .attr("class", ".tooltip")
        .style("fill", "green")
        .on('mouseover', function (d, i) {
            if (d != null) {
                tooltip.html('<div class="heatmap_tooltip">' + label[i][i] + ":" + d.toFixed(2) + '</div>');
                tooltip.style("visibility", "visible");
            } else
                tooltip.style("visibility", "hidden");
        })
        .on('mouseout', function () {
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (d, i) {
            tooltip.style("top", (d3.event.pageY - 55) + "px").style("left", (d3.event.pageX - 60) + "px");
        })
        .transition().duration(500)
        .style("fill", function (d) {
            return colorScale(scale(d));
        });

    //create legend bar to show the level of each chroma feature in color. Domain of chroma  [0,1]
    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform",
            "translate(" + -10 + " ," +
            (-20) + ")")
        .selectAll(".legendElement")
        .data([0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9])
        .enter().append("g")
        .attr("class", "legendElement");

    legend.append("rect")
        .attr("x", function(d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 20)
        .attr("class", "cellLegend bordered")
        .attr("width", legendElementWidth)
        .attr("height", cellSize / 2)
        .style("fill", function(d, i) {
            return colors[i];

        });

    legend.append("text")
        .attr("class", "mono legendElement")
        .text(function(d) {
            return "≥" + Math.round(d * 100) / 100;
        })
        .attr("x", function(d, i) {
            return legendElementWidth * i;
        })
        .attr("y", 20 + cellSize)
        .attr("font-size","5px");

}


function network_diagram(data) {
    var width = 560,
        height = 500;

    var color = d3.scale.category20();

    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(40)
        .size([width, height]);

    var x = d3.scale.linear()
        .domain([math.min(data), math.max(data)])
        .range([80, 250])
        .clamp(true);

    var brush = d3.svg.brush()
        .y(x)
        .extent([0, 0]);

    var svg = d3.select("#network").append("svg")
        .attr("width", width)
        .attr("height", height);

    var links_g = svg.append("g");

    var nodes_g = svg.append("g");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + (width - 20) + ",0)")
        .call(d3.svg.axis()
            .scale(x)
            .orient("left")
            .tickFormat(function (d) {
                return d;
            })
            .tickSize(0)
            .tickPadding(12))
        .select(".domain")
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo");

    var slider = svg.append("g")
        .attr("class", "slider")
        .call(brush);

    slider.selectAll(".extent,.resize")
        .remove();

    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(" + (width - 20) + ",0)")
        .attr("r", 5);


    svg.append("text")
        .attr("x", width - 15)
        .attr("y", 60)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .style("opacity", 0.5)
        .text("Euclidean Distance Threshold")


    var nodes = [];
    for (i = 0; i < column.length; i++) {
        nodes.push({"name": column[i]})
    }
    var links = [];
    var link2 = [];
    for (i = 0; i < column.length - 1; i++) {
        var link1 = [];
        for (j = i + 1; j < column.length; j++) {
            link1.push({"source": i, "target": j})
        }
        link2.push(link1)
    }
    data1 = d3.merge(data);
    links = d3.merge(link2);
    links.forEach(function (d, i) {
        d.value = data1[i];
    });
    links.forEach(function (d, i) {
        d.i = i;
    });

    function brushed() {
        var value = brush.extent()[0];

        if (d3.event.sourceEvent) {
            value = x.invert(d3.mouse(this)[1]);
            console.log(value)
            brush.extent([value, value]);
        }
        handle.attr("cy", x(value));
        var threshold = value;

        var thresholded_links = links.filter(function (d) {
            return (d.value <= threshold);
        });

        force
            .links(thresholded_links);

        var link = links_g.selectAll(".link")
            .data(thresholded_links, function (d) {
                return d.i;
            });

        link.enter().append("line")
            .attr("class", "link")
            .style("stroke-width", function (d) {
                return Math.sqrt(d.value);
            });

        link.exit().remove();

        force.on("tick", function () {
            link.attr("x1", function (d) {
                return d.source.x;
            })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });

            node.attr("cx", function (d) {
                return d.x;
            })
                .attr("cy", function (d) {
                    return d.y;
                });

            text.attr("x", function (d) {
                return d.x;
            })
                .attr("y", function (d) {
                    return d.y;
                });
        });

        force.start();

    }

    force
        .nodes(nodes);

    var node = nodes_g.selectAll(".node")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)
        .style("fill", function (d) {
            return color(d.group);
        })
        .call(force.drag)

    node.append("title")
        .text(function (d) {
            return d.name;
        });

    var text = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .attr("font-size", "10px")
        .text(function (d) {
            return d.name
        });


    brush.on("brush", brushed);

    slider
        .call(brush.extent([5, 5]))
        .call(brush.event);


}


//get file directory
// document.getElementById("filepicker").addEventListener("change", function(event) {
//     let output = document.getElementById("listing");
//     let files = event.target.files;
//
//     for (let i=0; i<files.length; i++) {
//         let item = document.createElement("li");
//         item.innerHTML = files[i].webkitRelativePath;
//         output.appendChild(item);
//     };
// }, false);