const fs = require('fs');

// Specify the path to your text file here
const path = 'test3.txt';

function readTextFileAndParse(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.trim().split('\n');
        const data = lines.map((line) => line.trim().split(' '));
        return data;
    } catch (error) {
        console.error('Error reading or parsing the file:', error);
        return null;
    }
}

function avg(arr) {
    if (arr.length == 0) {
        return 0; // Handle the case of an empty array to avoid division by zero.
    }

    let sum = 0;
    let len = arr.length;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == -1) {
            len -= 1;
        } else {
            sum += parseFloat(arr[i]);
        }
    }
    console.log(sum/len)
    return (sum / len);
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

function sim(a, b, ratings) {
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    let r_aavg = avg(ratings[a]);
    let r_bavg = avg(ratings[b]);

    for (let i = 0; i < ratings[0].length; i++) {
        let r_ap = ratings[a][i];
        let r_bp = ratings[b][i];
        if (r_ap != -1 && r_bp != -1) {
            numerator += ((r_ap - r_aavg) * (r_bp - r_bavg));
            denominator1 += ((r_ap - r_aavg) * (r_ap - r_aavg));
            denominator2 += ((r_bp - r_bavg) * (r_bp - r_bavg));
        }
    }

    denominator1 = Math.sqrt(denominator1);
    denominator2 = Math.sqrt(denominator2);

    let denominator = (denominator1 * denominator2);
    let result = (numerator / denominator);
    return result;
}

function sortByColumn(arr, column) {
    return arr.slice().sort((a, b) => b[column] - a[column]);
  }

function pred(a, p, ratings, neighbourhoodSize) {
    let r_aavg = avg(ratings[a]);

    let numerator = 0;
    let denominator = 0;

    tempArr = [];
    for (let b = 0; b < ratings.length; b++) {
        if (b != a) {
            let r_bavg = avg(ratings[b]);
            let r_bp = ratings[b][p];
            let temp = sim(a,b,ratings);
            // console.log(temp);
            tempArr.push([temp,r_bp,r_bavg]);
        }
    }

    top = sortByColumn(tempArr,0).slice(0,neighbourhoodSize);
    console.log(top);
    top.forEach(function (entry) {
        let temp = entry[0];
        let r_bp = entry[1];
        let r_bavg = entry[2];
        numerator += (temp * (r_bp - r_bavg));
        denominator += temp;
    });

    return (parseFloat(r_aavg + (numerator / denominator)).toFixed(2));
}

// Call the function to read and parse the file
let data = readTextFileAndParse(path);
const N = parseInt(data[0][0]);
const M = parseInt(data[0][1]);
const users = data[1];
const items = data[2];
const ratings = data.splice(3);

// console.log(`N: ${N}   M: ${M}\nUsers: ${users} \nItems: ${items}`);
// console.log(`Ratings:`);
// console.log(ratings);

let results = createZeroMatrix(N, M);

for (let i = 0; i < ratings.length; i++) {
    for (let j = 0; j < ratings[0].length; j++) {
        curRating = ratings[i][j];
        if (curRating == -1) {
            results[i][j] = pred(i, j, ratings, 2);
        } else {
            results[i][j] = curRating;
        }
    }
}

console.log(`Ratings:`);
console.log(results);