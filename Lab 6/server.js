var fs = require("fs");

function avg(arr) {
    if (arr.length == 0) {
        return 0; // Handle the case of an empty array to avoid division by zero.
    }

    let sum = 0;
    count =0
    for (let i = 0; i < arr.length; i++) {
        if(arr[i]>0){
            sum+=parseFloat(arr[i])
            count++
        }
    }

    return (sum / count);
}

function sim(a, b, ratings) {
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    let r_aavg = avg(ratings[a]);
    let r_bavg = avg(ratings[b]);

    for (let i = 0; i < ratings[0].length; i++) {
        //linking each rating per user to another
        let r_ap = ratings[a][i];
        //console.log(r_ap)
        let r_bp = ratings[b][i];
        //console.log(r_bp)
        if (r_ap != -1 && r_bp != -1) {
            numerator += ((r_ap - r_aavg) * (r_bp - r_bavg));
            denominator1 += ((r_ap - r_aavg) **2);
            denominator2 += ((r_bp - r_bavg) **2);
        }
    }

    let result = (numerator / Math.sqrt(denominator1 * denominator2));
    return result;
}

function pred(a, p, ratings) {
    let r_aavg = avg(ratings[a]);

    let numerator = 0;
    let denominator = 0;

    tempArr = [];
    for (let b = 0; b < ratings.length; b++) {
        if (b != a) {
            let r_bavg = avg(ratings[b]);
            let r_bp = ratings[b][p];
            let temp = parseFloat(sim(a,b,ratings).toFixed(2));
            // console.log(temp);
            tempArr.push([temp,r_bp,r_bavg]);
        }
    }
    console.log(tempArr)
    //we do a little sorting
    top = tempArr.slice().sort((a, b) => b[0] - a[0]).slice(0,2);
    //console.log(top);
    top.forEach(function (entry) {
        let temp = entry[0];
        console.log(temp)
        let r_bp = entry[1];
        console.log(r_bp)
        let r_bavg = entry[2];
        console.log(r_bavg)
        numerator += (temp * (r_bp - r_bavg));
        denominator += temp;
    });
    return (parseFloat(r_aavg + (numerator / denominator)).toFixed(2));
}

//change file names over here
const filePath = './test3.txt';
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
    } else {
        //console.log(data);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.trim().split('\n');
        const data = lines.map((line) => line.trim().split(' '));
        // Extract the number of users and items
        const N = parseInt(data[0][0]);
        const M = parseInt(data[0][1]);
        const rating = data.splice(3);
        //console.log(N,M)
        //console.log(rating)
        //creating a zero matrix to represent the NxM matrix for results
        results = [];
  
        for (i = 0; i < N; i++) {
            results.push([]);
            for (j = 0; j < M; j++) {
                results[i][j] = 0;
            }
        }
        //console.log(zeroMatrix)
        //results= [...zeroMatrix]
        //have separate functions to improve readability
        for(i=0;i<rating.length;i++){
            for(j=0;j<rating[0].length;j++){
                //console.log(rating[i][j])
                curRating = rating[i][j];
                if (curRating == -1) {
                    results[i][j] = pred(i, j, rating);
                } else {
                    results[i][j] = curRating;
                }
            }
        }
        console.log(results)
    }
});