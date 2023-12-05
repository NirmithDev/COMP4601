const fs = require("fs");

function readFileFromPath(path){
    try {
        const data = fs.readFileSync(path, "utf8");
        let lineArr = (data.trim("\n")).split("\n");
        [n, m] = lineArr[0].split(" ").map(Number);
        u = lineArr[1].split(" ");
        p = lineArr[2].split(" ");
        parseInput(data.trim("\n"));

    } catch (err) {
        console.error(err);
    }
};

function parseInput(str) {
    let lineArr = str.split("\n");
    // going through each row (user ratings)
    for (let i = 0; i < n; i++) {
        let u_i_ratings = lineArr[i + 3].trim().split(" ");
        currentUser = u[i]
        r[currentUser] = {};
        // going through each column of each row (rating from user[i] for each product j)
        u_sum[currentUser] = 0;
        u_num[currentUser] = 0;
        //get average of all everything exept
        for (let j = 0; j < m; j++) {
            rating = Number(u_i_ratings[j]);
            currentProduct = p[j];
            r[currentUser][currentProduct] = rating;
            // keep running sum for ratings of u[i]
            if (rating !== -1) {
                u_sum[currentUser] += rating;
                u_num[currentUser]++;
            }
        }
    }
};

function calculateCosineSimi(itemA,itemB){
    let num = 0;
    let diff1 = 0;
    let diff2 = 0;
    for (let i=0;i<u.length;i++) {
        let ru = u_sum[u[i]] / u_num[u[i]];
        if (r[u[i]][itemA] === -1 || r[u[i]][itemB] === -1) {
            continue;
        }
        num += (r[u[i]][itemA] - ru) * (r[u[i]][itemB] - ru);
        diff1 +=((r[u[i]][itemA] - ru)*(r[u[i]][itemA] - ru));
        diff2 += ((r[u[i]][itemB] - ru)*(r[u[i]][itemB] - ru));
    }
    if(diff1 === 0 || diff2 === 0){
        return 0;
    }
    return [diff1,diff2,num]
}

function calculateSim() {
    for (let itemA of p) {
        sim[itemA] = {};
        for (let itemB of p) {
            if (itemA === itemB) {
                continue;
            }
            let diffs = calculateCosineSimi(itemA,itemB)
            sim[itemA][itemB] = diffs[2] / (Math.sqrt(diffs[0]) * Math.sqrt(diffs[1]));
        }
    }
}

function pred(user, prod){
    let num = 0;
    let denom = 0;
    let predScore =0
    //console.log(sim[prod])
    let keysSorted = Object.keys(sim[prod]).sort((x, y) => {
        return sim[prod][y] - sim[prod][x];
    });
    let count = 0;
    for (let i of keysSorted) {
        if (count === neighbourhoodSize) {
            break;
        }
        if (r[user][i] === -1 || sim[prod][i] <= 0) {
            continue;
        }
        let rui = r[user][i];

        num += sim[i][prod] * rui;
        denom += sim[i][prod];
        count++;
    }
    predScore =(denom !== 0) ? num / denom : 0;
    return predScore;
};

function printOut(path) {
    calculateSim();
    newRating = []
    for (let user of u) {
        updateRat=[]
        for (let prod of p) {
            let rating = r[user][prod];
            if (rating === -1) {
                updateRat.push(pred(user, prod))
            } else {
                updateRat.push(rating)
            }
        }
        newRating.push(updateRat)
    }
    console.log(`Ratings for ${path}:`);
    console.table(newRating)
};

//users and items
let n = 0;
let m = 0;
//users name and items name or like id
let u = [];
let p = [];
let r = {}; // could be Map
let u_sum = {};
let u_num = {};
let sim = {};
let neighbourhoodSize = 2;

function main(){
    readFileFromPath("./test.txt");
    printOut("./test.txt");
    readFileFromPath("./test2.txt");
    printOut("./test2.txt");

    readFileFromPath("./test3.txt");
    printOut("./test3.txt");

    readFileFromPath("./testa.txt");
    printOut("./testa.txt");
}
main()