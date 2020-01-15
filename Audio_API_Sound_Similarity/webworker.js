let w;
function startWorker(data){
    if(typeof(Worker)!== "undefined"){
        if(w===undefined){
            w = new Worker('worker.js');
            w.postMessage(data);
        }
        w.onmessage = function(event){
                Initial_Scatterplot(event.data.content)
                d3.select("#textDiv").html(event.data.logMessage);
                console.log(event.data)
        };
    }
    else{
        throw "Browser doesn't support web worker";
    }
}
