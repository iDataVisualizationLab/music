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

    if (i == 0) {
        return mismatchScore
    } else {
        return matchScore
    }
}
// Implicit smith waterman align with diagonal constraints
// Inputs: CSM (a binary N x M cross-similarity matrix)
// Outputs: 1) Distance (scalar)
// 2) (N+1) x (M+1) dynamic programming matrix4

function score(crossimilarity) {
// N = crossimilarity.length[0]+1
// M = crossimilarity.length[1]+1
//math.zeros(math.size(A))
    arr=Array(crossimilarity[0].length+1).fill(Array(crossimilarity[0].length+1));
    D = math.zeros(math.size(arr))
    maxD = 0;
    for (i = 3; i < D[0].length; i++) {
        for (j = 3; j < D[0].length ; j++) {
            MS = Match(crossimilarity[i - 1][j - 1])
//H_(i-1, j-1) + S_(i-1, j-1) + delta(S_(i-2,j-2), S_(i-1, j-1))
            d1 = D[i - 1][j - 1] + MS + Delta(crossimilarity[i - 2][j - 2], crossimilarity[i - 1][ j - 1])
//H_(i-2, j-1) + S_(i-1, j-1) + delta(S_(i-3, j-2), S_(i-1, j-1))
            d2 = D[i - 2][j - 1] + MS + Delta(crossimilarity[i - 3][j - 2], crossimilarity[i - 1][j - 1])
//H_(i-1, j-2) + S_(i-1, j-1) + delta(S_(i-2, j-3), S_(i-1, j-1))
            d3 = D[i - 1][j - 2] + MS + Delta(crossimilarity[i - 2][j - 3], crossimilarity[i - 1][j - 1])
            D[i][j] = math.max(d1, d2, d3,0)
        }

    }

return math.max(D);
}
score(crossimilarity)