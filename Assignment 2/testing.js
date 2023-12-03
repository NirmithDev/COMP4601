const fs = require('fs');
const path = require('path');

const itemBased = require("./itemBasedMAE.js");
const userBased = require("./UserRecommend.js");

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

function convertArrayToCSV(array) {
    return array.map(row => row.join(',')).join('\n');
}

function main() {
    const topKParameters = [5,10,20,40,60,80,100];
    const thresholdParameters = [0, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 0.9, 1];

    let topKItemBased = [];
    let thresholdAboveItemBased = [];
    let thresholdBelowItemBased = [];
    let topKUserBased = [];
    let thresholdAboveUserBased = [];
    let thresholdBelowUserBased = [];

    const filePath = path.join(__dirname, 'parsed-data-trimmed.txt');
    const matrix = itemBased.createMatrix(filePath);

    for (let i = 0; i < topKParameters.length; i++) {
        // TopK item based
        console.time("TopKItemBased");
        let temp = itemBased.leaveOneOut(matrix, 'topK', topKParameters[i]);
        let x = console.timeEnd("TopKItemBased");
        topKItemBased.push([thresholdParameters[i], temp.MAE, x, temp.totalErrors, temp.predictionsMade]);

        // TopK user based
        console.time("TopKUserBased");
        temp = userBased.leaveOneOut(matrix[2], 'topK', topKParameters[i]);
        x = console.timeEnd("TopKUserBased");
        topKUserBased.push([thresholdParameters[i], temp, x]);
    }
    for (let i = 0; i < thresholdParameters.length; i++) {
        // Threshold above item based
        console.time("ThresholdAboveItemBased");
        let temp = itemBased.leaveOneOut(matrix, 'threshold-above', thresholdParameters[i]);
        let x = console.timeEnd("ThresholdAboveItemBased");
        thresholdAboveItemBased.push([thresholdParameters[i], temp.MAE, x, temp.totalErrors, temp.predictionsMade]);

        // Threshold below item based
        console.time("ThresholdBelowItemBased");
        temp = itemBased.leaveOneOut(matrix, 'threshold-below', thresholdParameters[i]);
        x = console.timeEnd("ThresholdBelowItemBased");
        thresholdBelowItemBased.push([thresholdParameters[i], temp.MAE, x, temp.totalErrors, temp.predictionsMade]);

        // Threshold above user base
        console.time("ThresholdAboveUserBased");
        temp = userBased.leaveOneOut(matrix[2], 'threshold-above', thresholdParameters[i]);
        x = console.timeEnd("ThresholdAboveUserBased");
        thresholdAboveUserBased.push([thresholdParameters[i], temp, x]);

        // Threshold below user base
        console.time("ThresholdBelowUserBased");
        temp = userBased.leaveOneOut(matrix[2], 'threshold-below', thresholdParameters[i]);
        x = console.timeEnd("ThresholdBelowUserBased");
        thresholdBelowUserBased.push([thresholdParameters[i], temp, x]);
    }

    console.log('============================================================');
    console.log('Item Based:');
    printTable(topKItemBased, ['Top K', 'MAE', 'Execution Time', 'Total Error', 'Predictions Made']);
    console.log('\n');
    printTable(thresholdAboveItemBased, ['Above Threshold', 'MAE', 'Execution Time', 'Total Error', 'Predictions Made']);
    console.log('\n');
    printTable(thresholdBelowItemBased, ['Below Threshold', 'MAE', 'Execution Time', 'Total Error', 'Predictions Made']);
    console.log('\n');
    console.log('============================================================');
    console.log('User Based:');
    printTable(topKUserBased, ['Top K', 'MAE', 'Execution Time']);
    console.log('\n');
    printTable(thresholdAboveUserBased, ['Above Threshold', 'MAE', 'Execution Time']);
    console.log('\n');
    printTable(thresholdBelowUserBased, ['Below Threshold', 'MAE', 'Execution Time']);
    console.log('\n');
    console.log('============================================================');

    fs.writeFileSync('topKItemBased', convertArrayToCSV(topKItemBased), 'utf-8');
    fs.writeFileSync('thresholdAboveItemBased', convertArrayToCSV(thresholdAboveItemBased), 'utf-8');
    fs.writeFileSync('thresholdBelowItemBased', convertArrayToCSV(thresholdBelowItemBased), 'utf-8');
    fs.writeFileSync('topKUserBased', convertArrayToCSV(topKUserBased), 'utf-8');
    fs.writeFileSync('thresholdAboveUserBased', convertArrayToCSV(thresholdAboveUserBased), 'utf-8');
    fs.writeFileSync('thresholdBelowUserBased', convertArrayToCSV(thresholdBelowUserBased), 'utf-8');
}

main();

/*
let MAE = leaveOneOut(matrix, setting, parameter);

console.log(`Type: ${setting} = ${parameter}`);
console.log("Predictions Made = ", MAE.predictionsMade);
console.log("Total Error = ", MAE.totalErrors);
console.log("MAE = ", MAE.MAE);
*/
