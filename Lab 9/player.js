const fs = require('fs')
//users
let u = [];
let p = [];
//liked
let userLiked = {};
let itemLikers = {};
let findFirstUser = "User1"
//read the file
const readFileFromPath = (path) => {
    try {
        const data = fs.readFileSync(path, "utf8");
        return data.trim("\n");
    } catch (err) {
        console.error(err);
    }
};
//clean it up
const parseInput = (str) => {
    let lineArr = str.split("\n");
  
    // number of users n and number of items m
    let strArr = lineArr[0].split(" ");
    n = Number(strArr[0]);
    m = Number(strArr[1]);
  
    // user names
    u = lineArr[1].split(" ");
    //console.log(u)
    //findFirstUser = "User1"
    //console.log(findFirstUser)
    // product names
    p = lineArr[2].split(" ");

    for (let i = 0; i < n; i++) {
        //getting user ratings starting posn is +3
        let u_i_ratings = lineArr[i+3].trim().split(" ");
        //console.log(u_i_ratings)
        userLiked[u[i]] = [];
        // going through each value
        for (let j = 0; j < m; j++) {
            //other values or nothing in there
            if (!itemLikers[p[j]]) {
                itemLikers[p[j]] = [];
            }
            //ratings only
            if (Number(u_i_ratings[j]) !== 0) {
                userLiked[u[i]].push(p[j]);
                if (!(u[i] in itemLikers[p[j]])) {
                    itemLikers[p[j]].push(u[i]);
                }
            }
        }
        //console.log(userLiked)
    }
    //console.log(userLiked)
}
function findPATH(){
    pathCount = {}
    for (let i = 0; i < p.length; i++) {
        pathCount[p[i]] = 0;
    }
    //console.log(pathCount)

    for (let i = 0; i < userLiked[findFirstUser].length; i++) {
        let item = userLiked[findFirstUser][i];
        //console.log(item)
        //console.log("--------------")
        // itemsWithPathCount[item]++;
        for (let j = 0; j < itemLikers[item].length; j++) {
            let liker = itemLikers[item][j];
            if (liker === findFirstUser) continue;
            //console.log(liker)
            for (let k = 0; k < userLiked[liker].length; k++) {
                let likersLiked = userLiked[liker][k];
                pathCount[likersLiked]++;
            }
        }
    }
    //console.log(pathCount)
    return pathCount;
    
}
//filtering and sorting these keys and displaying them
function dispOutput(beta){
    const filteredKeys = Object.keys(beta).filter(key => beta[key] !== 0 && !userLiked[findFirstUser].includes(key));
    const sortedKeys = filteredKeys.sort((keyA, keyB) => beta[keyB] - beta[keyA]);
    for (const key of sortedKeys) {
        console.log(`${key} --> ${beta[key]}`);
    }
    //this is needed since we are doing it for multiple files can be commented out for a single one though
    u = [];
    p = [];
    userLiked = {};
    itemLikers = {};
}

//, 'test2.txt', 'test3.txt', 'test4.txt', 'test5.txt'
const files = ['test.txt', 'test2.txt', 'test3.txt', 'test4.txt', 'test5.txt']
files.forEach(file=>{
    a = readFileFromPath(file)
    parseInput(a)
    beta=findPATH()
    console.log(`File Name ${file}`)
    dispOutput(beta)
})