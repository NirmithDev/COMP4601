const fs = require('fs');
const path = require('path');

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function createMatrix(filePath) {
    let data = readFile(filePath);
    let lines = data.split(/\r?\n/);

    let matrix = [];

    for (let i = 3; i < lines.length; i++) {
        let line = lines[i].split(' ').map(Number);
        matrix.push(line);
    }
    return matrix;
}

//Helper function to filter reviews that do not exist
function filterReviews(userA) {
    let filteredReviewsA = [];
    for (let i = 0; i < userA.length; i++) {
        if (userA[i] > 0)
            filteredReviewsA.push(userA[i]);
    }
    //console.log('Filtered reviews for user A: ', filteredReviewsA);
    //console.log('Filtered reviews for user B: ', filteredReviewsB);
    return filteredReviewsA;
}

function findNeigboursTGreater(userData, userIndex, threshold) {
    let neighbours = findNeighbours(userData, userIndex);
    neighbours = neighbours.filter((neighbour) => neighbour[1] >= threshold);
    return neighbours;
}

function findNeigboursTLess(userData, userIndex, threshold) {
    let neighbours = findNeighbours(userData, userIndex);
    neighbours = neighbours.filter((neighbour) => neighbour[1] <= threshold);
    return neighbours;
}

function findNeighbours(userData, userIndex) {
    let neighbours = [];
    let userA = userData[userIndex];
    for (let i = 0; i < userData.length; i++) {
        //console.log("index:", i)
        let userB = userData[i];

        if (i == userIndex) {
            continue;
        }

        //Filter out reviews that do not exist
        let filteredReviewsA = filterReviews(userA);
        let filteredReviewsB = filterReviews(userB);
        //console.log("Filtered reviews A: ", filteredReviewsA)
        //console.log("Filtered reviews B: ", filteredReviewsB)
        if (filteredReviewsA.length == 0 || filteredReviewsB.length == 0)
            continue;

        // //Get average review for each user
        // let averageReviewA = filteredReviewsA.reduce((a, b) => a + b, 0) / filteredReviewsA.length;
        // let averageReviewB = filteredReviewsB.reduce((a, b) => a + b, 0) / filteredReviewsB.length;

        //Filter out reviews from B again to match the length of the other user, ensuring we compare the same products
        let filteredReviewsFinalA = [];
        let filteredReviewsFinalB = [];
        for (let i = 0; i < userA.length; i++) {
            if (userA[i] > 0 && userB[i] > 0) {
                filteredReviewsFinalA.push(userA[i]);
                filteredReviewsFinalB.push(userB[i]);
            }
        }

        //Get average review for each user
        let averageReviewA = filteredReviewsFinalA.reduce((a, b) => a + b, 0) / filteredReviewsFinalA.length;
        let averageReviewB = filteredReviewsFinalB.reduce((a, b) => a + b, 0) / filteredReviewsFinalB.length;

        //Apply Pearson Correlation Formula
        let simNum = 0;
        let simDen1 = 0;
        let simDen2 = 0;
        for (let i = 0; i < filteredReviewsFinalA.length; i++) {
            simNum += (filteredReviewsFinalA[i] - averageReviewA) * (filteredReviewsFinalB[i] - averageReviewB);
            simDen1 += (filteredReviewsFinalA[i] - averageReviewA) ** 2
            simDen2 += (filteredReviewsFinalB[i] - averageReviewB) ** 2
        }
        //fs.writeFileSync("NEGEV.txt",simDen1+":::"+simDen2)
        let simDen = Math.sqrt(simDen1) * Math.sqrt(simDen2);
        //console.log("SimDen: ", simDen)
        let sim = 0;
        if (isNaN(simNum/simDen)) {
            continue;
        } 
        else {  
            sim = simNum / simDen;
        }
        //console.log('Similarity between user ' + userIndex + ' and user ' + i + ': ' + sim);
        //if(kUsers.length==5)
        //    break;
        //sim = Number(sim.toFixed(2));
        neighbours.push([i, sim]);
        

    }

    neighbours = neighbours.sort((a, b) => b[1] - a[1])//.slice(0, k);
    return neighbours;
}

function leaveOneOut(userData, neighbourhoodSize, threshold) {
    let userDataCopy = userData.map((arr) => arr.slice());

    /* Time to calculate MAE with these variables */
    let numMAE_K = 0;
    let numMAE_TG = 0;
    let numMAE_TL = 0;
    denMAE = 0;

    let zeroCount = 0;
    let fiveCount = 0;

    for (let i = 0; i < userData.length; i++) {
        for (let j = 0; j < userData[i].length; j++) {
            if (userData[i][j] > 0) {
                let temp = userData[i][j];
                //Make 0 and predict below
                userDataCopy[i][j] = 0;
                let kUsers = findNeighbours(userDataCopy, i);

                //Predict with threshold Neighbours approach, 1 prediction for >= threshold, 1 for <= threshold
                let tGreaterUsers = findNeigboursTGreater(userDataCopy, i, threshold);
                let tLessUsers = findNeigboursTLess(userDataCopy, i, threshold);
                if(i % 50 == 0) {
                    console.log("Length of tGreaterUsers: ", tGreaterUsers.length)
                    console.log("Length of tLessUsers: ", tLessUsers.length)
                }
                let numTG = 0;
                let denTG = 0;
                let numTL = 0;
                let denTL = 0;

                //Calculate Numerator and Denominator for Threshold approaches
                for (let k = 0; k < tGreaterUsers.length; k++) {
                    let userIndex = kUsers[k][0];
                    let similarity = kUsers[k][1];
                    let review = userDataCopy[userIndex][j];
                    if (review != 0) {
                        let filteredReviewsB = filterReviews(userDataCopy[userIndex]);
                        let averageReviewB = filteredReviewsB.reduce((a, b) => a + b, 0) / filteredReviewsB.length;
                        numTG += similarity * (review - averageReviewB);
                        denTG += similarity;
                    }
                }
                for (let k = 0; k < tLessUsers.length; k++) {
                    let userIndex = kUsers[k][0];
                    let similarity = kUsers[k][1];
                    let review = userDataCopy[userIndex][j];
                    if (review != 0) {
                        let filteredReviewsB = filterReviews(userDataCopy[userIndex]);
                        let averageReviewB = filteredReviewsB.reduce((a, b) => a + b, 0) / filteredReviewsB.length;
                        numTL += similarity * (review - averageReviewB);
                        denTL += similarity;
                    }
                }


                //Predict with K Neighbours approach, valid keeps track of users that have been used to predict
                let numK = 0;
                let denK = 0;
                let valid = 0;
                for (let k = 0; k < kUsers.length; k++) {
                    if(valid == neighbourhoodSize) {
                        break;
                    }

                    let userIndex = kUsers[k][0];
                    let similarity = kUsers[k][1];

                    if (similarity < 0) {
                        continue;
                    }
                    let review = userDataCopy[userIndex][j];
                    if (review != 0) {
                        //console.log("k user", k)
                        valid++;
                        let filteredReviewsB = filterReviews(userDataCopy[userIndex]);
                        let averageReviewB = filteredReviewsB.reduce((a, b) => a + b, 0) / filteredReviewsB.length;
                        numK += similarity * (review - averageReviewB);
                        denK += similarity;
                    }
                }
                //Calculate Average Review value of user
                let count = 0;
                let counter = 0
                for (let c = 0; c < userDataCopy[i].length; c++) {
                    if (userDataCopy[i][c] > 0) {
                        count += userDataCopy[i][c];
                        counter++;
                    }
                }
                count /= counter; //count is now the average review value of user
                let pred = count;

                // num/den is simply the margin of rating difference from user's average rating, add it to the average rating of user
                // Increment margin of rating difference, Prediction complete

                // Three predictions, one for k neighbours, one for t greater neighbours, one for t less neighbours
                let predKUsers = pred + numK / denK;
                let predTGUsers = pred + numTG / denTG;
                let predTLUsers = pred + numTL / denTL;


                // 3 Edge cases for 3 approaches, 9 cases in total to handle
                if(denK == 0){
                    predKUsers = pred
                }
                if(denTG == 0){
                    predTGUsers = pred
                }
                if(denTL == 0){
                    predTLUsers = pred
                }

                if (predKUsers >= 5) {
                    predKUsers = 5;
                    fiveCount++;
                }

                if(predTGUsers >= 5){
                    predTGUsers = 5;
                }

                if(predTLUsers >= 5){
                    predTLUsers = 5;
                }

                if (predKUsers <= 0.5) {
                    predKUsers = 1;
                    zeroCount++;
                }

                if(predTGUsers <= 0.5){
                    predTGUsers = 1;
                }

                if(predTLUsers <= 0.5){
                    predTLUsers = 1;
                }

                // if(i % 50 == 0) {
                //     console.log("Rating predictions for user: ", i)
                //     console.log("KPred: ", predKUsers)
                //     console.log(">= Thresh: ", predTGUsers)
                //     console.log("<= Thresh: ", predTLUsers)
                //     console.log("Actual: ", temp)
                // }
                    

                //Get MAE Num and Den as descrived in slides
                numMAE_K += Math.abs(temp - predKUsers);
                numMAE_TG += Math.abs(temp - predTGUsers);
                numMAE_TL += Math.abs(temp - predTLUsers);
                denMAE += 1;
                userDataCopy[i][j] = Number(temp);
                //}
                //userDataCopy[i][j] = Number(temp);
                //console.log("User Data Copy: ", userDataCopy[i][j])
            }
        }
    }

    //Time to calculate MAE
    // console.log("Zero Count: ", zeroCount)
    // console.log("Five Count: ", fiveCount)
    let MAE_K = numMAE_K / denMAE;
    let MAE_TG = numMAE_TG / denMAE;
    let MAE_TL = numMAE_TL / denMAE;
    return {MAE_K, MAE_TG, MAE_TL} ;
}

let filePath = path.join(__dirname, 'assignment2-data.txt');
//let filePath = path.join(__dirname, 'Lab6Data', 'test1.txt');
let matrix = createMatrix(filePath);

//let neighbors = findNeigbours(matrix, 12, 5);
//console.log("Neighbors: ", neighbors);

let MAE = leaveOneOut(matrix, 5, 0.5);
let MAE_K = MAE.MAE_K;
let MAE_TG = MAE.MAE_TG;
let MAE_TL = MAE.MAE_TL;

console.log("MAE from leave one out predictions: ", MAE_K);
console.log("MAE from leave one out predictions with threshold: ", MAE_TG);
console.log("MAE from leave one out predictions with threshold: ", MAE_TL);

module.exports = {leaveOneOut, createMatrix, readFile, filterReviews, findNeighbours, findNeigboursTGreater, findNeigboursTLess};

//export {leaveOneOut, createMatrix, readFile, filterReviews, findNeighbours, findNeigboursTGreater, findNeigboursTLess};

/*
function recommendProducts(userData) {

    // Hyperparemeter for k-similar users
    let neighbourhoodSize = 2;
    let userDataCopy = userData.map((arr) => arr.slice());

    for (let i = 0; i < userData.length; i++) {
        for (let j = 0; j < userData[i].length; j++)
            //If a product has not been reviewed, time to predict
            if (userData[i][j] == 0) {
                //Get k-similar users and their similarity
                let kUsers = findNeigbours(userData, i, neighbourhoodSize);

                //Set up initial value of prediction as average of user i, as given in formula in slides
                let count = 0;
                let counter = 0
                for (let c = 0; c < userData[i].length; c++) {
                    if (userData[i][c] >= 0) {
                        count += userData[i][c];
                        counter++;
                    }
                }
                count /= counter;
                let pred = count;

                //Apply formula to predict rating
                let num = 0;
                let den = 0;
                for (let k = 0; k < kUsers.length; k++) {
                    let userIndex = kUsers[k][0];
                    let similarity = kUsers[k][1];
                    let review = userData[userIndex][j];
                    // console.log("Similar User#: ", k)
                    // console.log("User index: ", userIndex)
                    if (review != 0) {
                        let filteredReviewsB = filterReviews(userData[userIndex]);

                        //let averageReviewA = filteredReviewsA.reduce((a, b) => a + b, 0) / filteredReviewsA.length;
                        let averageReviewB = filteredReviewsB.reduce((a, b) => a + b, 0) / filteredReviewsB.length;


                        //console.log("Average review A: ", averageReviewA)
                        num += similarity * (review - averageReviewB);
                        den += similarity;
                    }
                }
                if (den == 0) {
                    userDataCopy[i][j] = Number(pred.toFixed(2));
                    continue;
                }
                pred += num / den;
                userDataCopy[i][j] = Number(pred.toFixed(2));
            }
    }
    return userDataCopy;
}*/