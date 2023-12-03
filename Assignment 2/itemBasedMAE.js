const fs = require('fs');
const path = require('path');

//const neighbourhoodSize = 5;

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function createMatrix(filePath) {
    const fileContent = readFile(filePath);
    const lines = fileContent.trim().split("\n");
    const data = lines.map((line) => line.trim().split(" "));
    //console.log(data[0])
    const matrix = data.slice(3).map((row) => row.map(Number));
    const N = parseInt(data[0][0]);
    const M = parseInt(data[0][1]);
    
    console.log(matrix[0].length)
    //console.log(matrix[0])
    return [N,M,matrix]
    //return data
}

function cosineSimilarity(i, j, matrix, userAverages) {
    let numerator = 0;
    let denominatorI = 0;
    let denominatorJ = 0;

    for (let u = 0; u < matrix.length; u++) {
        const r_ui = matrix[u][i];
        const r_uj = matrix[u][j];
        //const userRatings = matrix[u];
        //const r_ui = userRatings[i];
        //const r_uj = userRatings[j];
        if (r_ui !== 0 && r_uj !== 0) {
            const r_uavg = userAverages[u].avg;
            //console.log(r_uavg)
            const diffI = r_ui - r_uavg;
            const diffJ = r_uj - r_uavg;
            numerator += diffI * diffJ;
            denominatorI += diffI*diffI;
            denominatorJ += diffJ*diffJ;
        }
    }

    const similarityDenominator = Math.sqrt(denominatorI) * Math.sqrt(denominatorJ);
    if (similarityDenominator === 0) return 0;

    return numerator / similarityDenominator;
}

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

function findNeigboursPredict(i,j,simis,matrix,neighbourhoodSize,avgs){
    let averagesForIthUser = avgs[i].avg;
    let numerator = 0;
    let denominator = 0;
    let ratedSimilarity = [];
    for (let k = 0; k < matrix[i].length; k++) {
        if (matrix[i][k] !== 0 && simis[k] > 0 && k !== j) {
            ratedSimilarity.push([simis[k], matrix[i][k]]);
        }
    }

    if (ratedSimilarity.length === 0) {
        //noValidNeighbors++;
        return averagesForIthUser;
    }

    if (neighbourhoodSize > ratedSimilarity.length) {
        neighbourhoodSize = ratedSimilarity.length;
    }

    let ratedSimilatiy = ratedSimilarity.sort((a, b) => b[0] - a[0]);
    let topNeighbors = ratedSimilatiy.slice(0,neighbourhoodSize);
    //console.log(topNeighbors)
    topNeighbors.forEach(([similarity, r_ui]) => {
        numerator += similarity * r_ui;
        denominator += Math.abs(similarity);
    });
    let prediction = numerator / denominator;

    if (denominator === 0) return averagesForIthUser;
    
    if (prediction > 5) {
        //rGreaterFive++;
        return 5;
    }
    if (prediction <= 0) {
        //rLessThanOne++;
        return 1;
    }
    return prediction;
}

function getSimis(matrixes,j,uAverage){
    const numItems = matrixes[0].length;
    //console.log(numItems)
    let itemSimilarities = Array(numItems).fill(0);

    for (let k = 0; k < numItems; k++) {
        if (k !== j) {
            let similarity = cosineSimilarity(j, k, matrixes,uAverage);
            itemSimilarities[k] = similarity;
        }
    }
    return itemSimilarities
}

function leaveOneOut(matrix){
    const N = matrix[0]
    //console.log(matrix[0])
    const M = matrix[1]
    //const N = parseInt(matrix[0][0]);
    //const M = parseInt(matrix[0][1]);
    const matrixes = matrix[2]//.slice(3).map((row) => row.map(Number));
    const MAE = { totalErrors: 0, predictionsMade: 0 };
    const OUTPUT = { MAE: 0, matrix: [], errors: 0, predictions: 0 };
    //console.log(matrix[1])
    //these are our ratings
    //let matrixes = matrix[2]
    numMAE = 0;
    denMAE = 0;
    //console.log(matrix[2][0])
    //create a zero by zero matrix for the matrixes and whereever it reaches the zeroth value we get pcc and cosine simis
    let zeroMat = createZeroMatrix(N,M)
    //get Sums and Number of ratings for each and all users
    let uAverage = calculateSumsNums(matrixes)
    //let [sums,nums,uAverage] = calculateSumsNums
    //console.log(sums)
    //console.log(nums)
    //console.log(avgs)
    //iterate over all values check if they are 0
    for(let i=0;i<N;i++){
        for(let j=0;j<M;j++){
            //update the zeroMat or zeroMatrix to include the values
            if(matrixes[i][j]===0){
                zeroMat[i][j] = matrixes[i][j];
            }else{
                //UPDATE SUMS AND COUNT AND GET AVG FOR THIS USER
                let tempAvg = uAverage[i].avg
                let sum = uAverage[i].sum-matrixes[i][j];
                let count = uAverage[i].count-1;
                if(count===0){
                    uAverage[i].avg = 0
                }else{
                    uAverage[i].avg = sum/count
                }
                //temporary rating
                let temp = matrixes[i][j];
                //tempSum=sums[i]
                //tempNums=nums[i]
                //Make 0 and predict below
                matrixes[i][j] = 0;
                //averagesForIthUser =avgs[i]
                //let simis //= getSimis(matrixes,j,uAverage)
                const numItems = matrixes[0].length;
                //console.log(numItems)
                let simis = Array(numItems).fill(0);

                for (let k = 0; k < numItems; k++) {
                    if (k !== j) {
                        let similarity = cosineSimilarity(j, k, matrixes,uAverage);
                        simis[k] = similarity;
                    }
                }
                //return itemSimilarities
                

                //call our find Neighbor
                let neighbourhoodSize = 5
                zeroMat[i][j]= findNeigboursPredict(i,j,simis,matrixes,neighbourhoodSize,uAverage)
                matrixes[i][j] = temp;
                uAverage[i].avg = tempAvg;
                const diff = Math.abs(zeroMat[i][j] - matrixes[i][j]);
                numMAE += diff;
                denMAE++;
                MAE.totalErrors += diff;
                MAE.predictionsMade++;
            }
        }
    }
    OUTPUT.MAE = MAE.totalErrors / MAE.predictionsMade;
    console.log(MAE.predictionsMade)
    //console.log(zeroMat)
    console.log(numMAE/denMAE)
    return MAE
}

//can use to calculate averages but we are cool so we do just the numbers and sums that are valid ratings
function calculateSumsNums(ratings){
    /*let sums = [];
    let nums = [];
    let avg = [];
    for (let i = 0; i < ratings.length; i++) {
        let sum = 0;
        let count = 0;

        for (let j = 0; j < userRatings.length; j++) {
            let rating = ratings[i][j];
            if (rating !== 0) {
                sum += parseFloat(rating);
                count++;
            }
        }

        sums.push(sum)
        nums.push(count);
        if(count === 0){
            avg.push(0)
        }else{
            avg.push(sum/count);
        }
        
    }
    return [sums,nums,avg]*/
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

function main(){
    //parsed-data-trimmed
    let filePath = path.join(__dirname, 'parsed-data-trimmed.txt');
    let matrix = createMatrix(filePath);
    console.log(matrix[0]);
    console.log(matrix[1]);
    console.log(matrix[2][0]);
    //function call to update the matrix and calculate similarities and predictions
    //N = people first value
    //M = items 2nd value
    //matrix = 3rd value
    let MAE = leaveOneOut(matrix) 
    //let neighbors = findNeigbours(matrix, 12, 5);
    //console.log("Neighbors: ", neighbors);

    //let MAE = leaveOneOut(matrix, 5);
    console.log("MAE from leave one out predictions: ", MAE);
}
main()