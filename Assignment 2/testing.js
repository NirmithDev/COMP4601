const fs = require('fs');
const path = require('path');

const itemBased = require("./itemBasedMAE.js");
const userBased = require("./itemBasedMAE.js");

function printTable(matrix, columns) {
    const tableData = matrix.map((row) => {
        return columns.reduce((obj, col, index) => {
        obj[col] = row[index];
        return obj;
        }, {});
    });
    
    // Print the table to the console
    console.table(tableData);
}

function main() {
    const topKParameters = [2,5,10,15,20,25,30,35,40,45,50,55,50,65,70,75,80,85,90,95,100];
    const thresholdParameters = [0, 0.05, 0.1, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];

    let topKItemBased = [];
    let thresholdItemBased = [];
    let topKUserBased = [];
    let thresholdUserBased = [];

    const filePath = path.join(__dirname, 'parsed-data-trimmed.txt');
    const matrix = itemBased.createMatrix(filePath);

    for (let i = 0; i < topKParameters.length; i++) {
        let temp = itemBased.leaveOneOut(matrix, 'topK', topKParameters[i]);
        topKItemBased.push([i, temp.MAE, temp.totalErrors, temp.predictionsMade]);
        // temp = userBased.leaveOneOut(matrix, 'topK', topKParameters[i]);
        // topKUserBased.push([i, temp.MAE, temp.totalErrors, temp.predictionsMade]);
    }
    for (let i = 0; i < thresholdParameters.length; i++) {
        let temp = itemBased.leaveOneOut(matrix, 'threshold', thresholdParameters[i]);
        thresholdItemBased.push([i, temp.MAE, temp.totalErrors, temp.predictionsMade]);
        // temp = userBased.leaveOneOut(matrix, 'threshold', thresholdParameters[i]);
        // thresholdUserBased.push([i, temp.MAE, temp.totalErrors, temp.predictionsMade]);
    }

    console.log('============================================================');
    console.log('Item Based:');
    printTable(topKItemBased, ['Top K', 'MAE', 'Total Error', 'Predictions Made']);
    console.log('\n');
    printTable(thresholdItemBased, ['Threshold', 'MAE', 'Total Error', 'Predictions Made']);
    console.log('\n');
    console.log('============================================================');
    console.log('User Based:');
    // printTable(topKUserBased, ['Top K', 'MAE', 'Total Error', 'Predictions Made']);
    // console.log('\n');
    // printTable(thresholdUserBased, ['Threshold', 'MAE', 'Total Error', 'Predictions Made']);
    console.log('============================================================');
    // console.log('\n\n\nThreshold:');
    // console.table(thresholdItemBased);
}

main();

/*
let MAE = leaveOneOut(matrix, setting, parameter);

console.log(`Type: ${setting} = ${parameter}`);
console.log("Predictions Made = ", MAE.predictionsMade);
console.log("Total Error = ", MAE.totalErrors);
console.log("MAE = ", MAE.MAE);
*/
