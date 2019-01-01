function euclideanDistance(a, b) {
    sum = 0;
    for (var i = 0; i < a.length; i++) {

        sum += math.pow(a[i] - b[i], 2)
    }
    return math.sqrt(sum)
}


//Create Cross similarity Matrix from 2 SSM data
crossimilarity = [];
cross1=[];
cross2=[];
for (var i = 0; i < matrix1.length; i++) {
    CSM = [];
    for (var j = 0; j < matrix2.length; j++) {
        CSM.push(euclideanDistance(matrix1[i], matrix2[j]))

    }
    crossimilarity.push(CSM.slice());
    cross1.push(CSM.slice());
    cross2.push(CSM.slice());

}

function sortrow(a) {
    a = a.slice();
//sort the row of coss similarity matrix then take the k*row.length point
    rowsort = [];
    for (var i = 0; i < a[1].length; i++) {
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
        a = a.slice();
//sort the column
    column = [];
    column = _.unzip(a)
    sortcolumn = [];
    for (var i = 0; i < column[1].length; i++) {
        sortcolumn.push(column[i].sort(function (a, b) {
            return a - b;
        }))
    }
    sortcolumnmin = [];
    for (var i = 0; i < sortcolumn.length; i++) {
        sortcolumnmin.push(sortcolumn[i][10])
    }

//get the min value of column and row to check the condition
}

sortrow(cross1);
sortcol(cross2);

//draw binary matrix
function drawbinarymatrix() {
    for (var i = 0; i < crossimilarity[0].length; i++) {
        minrowcol = math.min(rowsortmin[i], sortcolumnmin[i])
        for (var j = 0; j < crossimilarity[0].length; j++) {
            if (crossimilarity[i][j] < minrowcol) {
                crossimilarity[i][j] = 0;
            } else {
                crossimilarity[i][j] = 1;
            }
        }
    }
    var k = crossimilarity.length;
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    var imgData = ctx.createImageData(60, 60);
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
    //console.log(imgData.data);
    //where to draw the whole image
    ctx.putImageData(imgData, count * 620, 1200);
}

drawbinarymatrix()



