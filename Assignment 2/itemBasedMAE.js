const fs = require('fs');
const path = require('path');

const setting = 'threshold';    // threshold, topK
const parameter = 0.1;         // threshold value, or topK value

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

// Parse the file data into a list, [height,width,matrix]
function createMatrix(filePath) {
    const fileContent = readFile(filePath);
    const lines = fileContent.trim().split("\n");
    const data = lines.map((line) => line.trim().split(" "));
    const matrix = data.slice(3).map((row) => row.map(Number));
    const N = parseInt(data[0][0]);
    const M = parseInt(data[0][1]);

    return [N,M,matrix];
}

// Calculate the cosine similarity between item i and item j over every user
function cosineSimilarity(i, j, matrix, userAverages) {
    let numerator = 0;
    let denominatorI = 0;
    let denominatorJ = 0;

    for (let u = 0; u < matrix.length; u++) {
        const r_ui = matrix[u][i];
        const r_uj = matrix[u][j];
        if (r_ui !== 0 && r_uj !== 0) {
            const r_uavg = userAverages[u].avg;
            const diffI = r_ui - r_uavg;
            const diffJ = r_uj - r_uavg;
            numerator += diffI * diffJ;
            denominatorI += diffI*diffI;
            denominatorJ += diffJ*diffJ;
        }
    }

    const similarityDenominator = Math.sqrt(denominatorI) * Math.sqrt(denominatorJ);
    if (similarityDenominator === 0) { return 0; }

    return (numerator / similarityDenominator);
}

// Create an n x m zero matrix
function createZeroMatrix(n, m) {
    const matrix = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(0);
        }
        matrix.push(row);
    }
    return matrix;
}

// Predicts rating based on similarity between specified neighbor item similarities over users
function findNeigboursPredict(i,j,simis,ratings,parameter,avgs,setting){
    let averagesForIthUser = avgs[i].avg;
    let numerator = 0;
    let denominator = 0;
    let ratedSimilarity = [];
    for (let k = 0; k < ratings[i].length; k++) {
        if (ratings[i][k] !== 0 && simis[k] > 0 && k !== j) {
            ratedSimilarity.push([simis[k], ratings[i][k]]);
        }
    }

    if (ratedSimilarity.length === 0) {
        return averagesForIthUser;
    }

    let neighbors = [];
    if (setting === 'topK'){
        if (parameter > ratedSimilarity.length) {
            parameter = ratedSimilarity.length;
        }

        let ratedSimilatiy = ratedSimilarity.sort((a, b) => b[0] - a[0]);
        neighbors = ratedSimilatiy.slice(0,parameter);

    } else if (setting === 'threshold') {
        let ratedSimilatiy = ratedSimilarity.filter(value => value[0] >= parameter);
        neighbors = ratedSimilatiy;
    }

    neighbors.forEach(([similarity, r_ui]) => {
        numerator += similarity * r_ui;
        denominator += Math.abs(similarity);
    });

    if (denominator === 0) return averagesForIthUser;

    let prediction = numerator / denominator;
    
    if (prediction > 5) {
        return 5;
    }
    if (prediction <= 0) {
        return 1;
    }
    return prediction;
}

// "Leave One Out" Cross Validation for our item based prediction
// settings = 'topK', 'threshold'
// parameter = int or float
function leaveOneOut(matrix, settings, parameter){
    const N = matrix[0]
    const M = matrix[1]
    const ratings = matrix[2]
    const MAE = { totalErrors: 0, predictionsMade: 0, MAE: 0 };
    numMAE = 0;
    denMAE = 0;
    let zeroMat = createZeroMatrix(N,M)
    let uAverage = calculateSumsNums(ratings)
    for(let i = 0; i < N; i++){
        for(let j = 0; j < M; j++){
            if(ratings[i][j] === 0){
                zeroMat[i][j] = ratings[i][j];
            }else{
                let tempAvg = uAverage[i].avg
                let sum = uAverage[i].sum-ratings[i][j];
                let count = uAverage[i].count-1;
                if(count === 0){
                    uAverage[i].avg = 0;
                }else{
                    uAverage[i].avg = sum/count;
                }
                let temp = ratings[i][j];
                ratings[i][j] = 0;
                let simis = Array(M).fill(0);

                for (let k = 0; k < M; k++) {
                    if (k !== j) {
                        simis[k] = cosineSimilarity(j, k, ratings, uAverage);
                    }
                }

                zeroMat[i][j]= findNeigboursPredict(i,j,simis,ratings,parameter,uAverage,settings)
                ratings[i][j] = temp;
                uAverage[i].avg = tempAvg;
                const diff = Math.abs(zeroMat[i][j] - ratings[i][j]);
                numMAE += diff;
                denMAE++;
                MAE.totalErrors += diff;
                MAE.predictionsMade++;
            }
        }
    }
    // console.log(`Number of Predictions Made = ${MAE.predictionsMade}`);
    // console.log(`MAE = ${numMAE/denMAE}`);
    MAE.MAE = numMAE/denMAE;
    return MAE
}

// Calculates the sum of all item ratings for each user, and returns it in an array of objects
/*
    [
        {
            sum: sum of user's rating
            count: number of item ratings from the user
            avg: sum / count
        },
        {
            sum: sum of user's rating
            count: number of item ratings from the user
            avg: sum / count
        },
        ...
    ]
*/
function calculateSumsNums(ratings){
    return ratings.map((userRatings) => {
        let sum = 0;
        let count = 0;
        userRatings.forEach((rating) => {
          if (rating !== 0) {
            sum += parseFloat(rating);
            count++;
          }
        });
        return { sum: sum, count: count, avg: count === 0 ? 0 : sum / count };
    });
}

// Main function to calculate and output the MAE
// function main(){
//     let filePath = path.join(__dirname, 'parsed-data-trimmed.txt');
//     let matrix = createMatrix(filePath);
//     let MAE = leaveOneOut(matrix, setting, parameter);

//     console.log(`Type: ${setting} = ${parameter}`);
//     console.log("Predictions Made = ", MAE.predictionsMade);
//     console.log("Total Error = ", MAE.totalErrors);
//     console.log("MAE = ", MAE.MAE);
// }


// main();

module.exports = {
    leaveOneOut,
    createMatrix,
};