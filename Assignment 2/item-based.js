// Leave one out and MAE
// item based, ignoring negative similarities
// default set to threshold-based, threshold = 0

const start = Date.now();
const topKBool = false; // true for top-K, false for threshold
const threshold = 0.1; // 0, 0.05, 0.1, 0.25, 0.5, 0.75
const filename = "./parsed-data-trimmed.txt";
// const filename = "./assignment2-data.txt";
const neighbourhoodSize = 20; // 2, 5, 10, 20, 50, 100
const noRating = 0;

// smaller test set
// const filename = "./test2.txt";
// const neighbourhoodSize = 2;
// const noRating = -1;

const fs = require("fs");

let n = 0;
let m = 0;
let u = [];
let p = [];
let r = {}; // could be Map
let u_sum = {};
let u_num = {};
let sim = {};

const readFileFromPath = (path) => {
  try {
    const data = fs.readFileSync(path, "utf8");
    return data.trim("\n");
  } catch (err) {
    console.error(err);
  }
};

const parseInput = (str) => {
  let lineArr = str.split("\n");

  // number of users n and number of items m
  let strArr = lineArr[0].split(" ");
  n = Number(strArr[0]);
  m = Number(strArr[1]);

  // user names
  u = lineArr[1].split(" ").slice(0, u.length - 1);

  // product names
  p = lineArr[2].split(" ").slice(0, p.length - 1);

  // going through each row (user ratings)
  for (let i = 0; i < n; i++) {
    let u_i_ratings = lineArr[i + 3].trim().split(" ");
    r[u[i]] = {};
    // going through each column of each row (rating from user[i] for each product j)
    u_sum[u[i]] = 0;
    u_num[u[i]] = 0;

    for (let j = 0; j < m; j++) {
      // keep running sum for ratings of u[i]
      if (Number(u_i_ratings[j]) !== noRating) {
        r[u[i]][p[j]] = Number(u_i_ratings[j]);
        u_sum[u[i]] += Number(u_i_ratings[j]);
        u_num[u[i]] += 1;
      }
    }
  }
};

const simOf = (user1, a, pKeys) => {
  sim[a] = {};
  for (let index = 0; index < pKeys.length; index++) {
    let b = pKeys[index];
    if (a === b || r[user1][b] === noRating) {
      continue;
    }
    let num = 0;
    let diff_sq_1 = 0;
    let diff_sq_2 = 0;

    for (let index = 0; index < u.length; index++) {
      let user = u[index];
      if (user === user1 || !(r[user][a] && r[user][b])) {
        continue;
      }
      if (r[user][a] === noRating || r[user][b] === noRating) {
        continue;
      }
      let ru = u_sum[user] / u_num[user];
      num += (r[user][a] - ru) * (r[user][b] - ru);
      diff_sq_1 += Math.pow(r[user][a] - ru, 2);
      diff_sq_2 += Math.pow(r[user][b] - ru, 2);
    }
    sim[a][b] = num / (Math.sqrt(diff_sq_1) * Math.sqrt(diff_sq_2));
  }
};

let noValidNeighbours = 0;

const pred = (user, prod) => {
  let num = 0;
  let denom = 0;

  let count = 0;
  let neighbourList = [];
  let simKeys = Object.keys(sim[prod]);

  if (topKBool) {
    // top-K
    for (let n = 0; n < neighbourhoodSize; n++) {
      let maxI = null;
      let maxVal = 0;
      for (let index = 0; index < simKeys.length; index++) {
        let i = simKeys[index];
        if (
          r[user][i] === undefined ||
          r[user][i] === noRating ||
          sim[prod][i] <= 0 ||
          isNaN(sim[prod][i]) ||
          neighbourList.includes(i)
        ) {
          continue;
        }
        if (maxVal <= sim[prod][i]) {
          maxVal = sim[prod][i];
          maxI = i;
        }
      }

      if (maxVal > 0 && maxI !== null) {
        count++;
        neighbourList.push(maxI);
      }
    }
  } else {
    // threshold based
    for (let index = 0; index < simKeys.length; index++) {
      let i = simKeys[index];
      if (
        r[user][i] === undefined ||
        r[user][i] === noRating ||
        sim[prod][i] <= 0 ||
        isNaN(sim[prod][i]) ||
        neighbourList.includes(i)
      ) {
        continue;
      }
      if (sim[prod][i] > threshold) {
        count++;
        neighbourList.push(i);
      }
    }
  }

  if (count === 0) {
    num = u_sum[user];
    denom = u_num[user];
    noValidNeighbours += 1;
  } else {
    for (let index = 0; index < count; index++) {
      let i = neighbourList[index];
      let rui = r[user][i];
      num += sim[prod][i] * rui;
      denom += sim[prod][i];
    }
  }

  let predScore = num / denom;
  if (predScore < 1) {
    underPred += 1;
    predScore = 1;
  } else if (predScore > 5) {
    overPred += 1;
    predScore = 5;
  }
  return predScore;
};

let fileContent = readFileFromPath(filename);
// populate u, p, r
parseInput(fileContent);

let totalPred = 0;

// leave one out logic
// go through each item in a user (that is rated)
// predict score on current item
// store that in a matrix

// mae
// loop through all users
//  loop though all predicted ratings for user
//  sum abs ( difference between pred and original )
//  sum num elements in predicted ratings

// optimized by keeping a running sum

let underPred = 0;
let overPred = 0;
let rec = {};
const leaveOneOut = () => {
  let maeNum = 0;
  let maeDenom = 0;
  for (let index = 0; index < u.length; index++) {
    let user = u[index];
    rec[user] = {};
    let pKeys = Object.keys(r[user]);

    for (let index1 = 0; index1 < pKeys.length; index1++) {
      let prod = pKeys[index1];
      if (r[user][prod] === undefined || r[user][prod] === noRating) {
        continue;
      }
      // console.log("Crossing out user", user, "and product", prod);
      let tempHold = r[user][prod];
      u_sum[user] -= tempHold;
      u_num[user] -= 1;
      r[user][prod] = noRating;
      totalPred += 1;
      // let simStart = Date.now();
      simOf(user, prod, pKeys);
      // let simEnd = Date.now();
      // console.log(`sim execution time: ${simEnd - simStart} ms`);

      rec[user][prod] = pred(user, prod);
      r[user][prod] = tempHold;
      u_sum[user] += tempHold;
      u_num[user] += 1;
      maeNum += Math.abs(rec[user][prod] - r[user][prod]);
      maeDenom += 1;
    }
  }
  console.log("maeNum", maeNum);
  console.log("maeDenom", maeDenom);

  return maeNum / maeDenom;
};

console.log("MAE:", leaveOneOut());
console.log("Total predictions:", totalPred);
console.log("no valid neighbours:", noValidNeighbours);
console.log("Top-K?", topKBool);
console.log("neighbourhood size:", neighbourhoodSize);
console.log("threshold:", threshold);
const end = Date.now();
console.log(`Execution time: ${end - start} ms`);
