const Crawler = require("crawler");
const url = require("url"); // Import the url module

let visitedUrls = new Set(); // Initialize a set to track visited URLs
let visitedTitles = new Set(); // Initialize a set to track visited page titles
let pageCount = 0; // Initialize a page counter

const c = new Crawler({
    maxConnections: 10,
    callback: function (error, res, done) {
        if (error) {
            console.log(error);
        } else {
            let $ = res.$;

            // Extract content as needed
            const title = $("title").text().trim(); // Get and trim the page title
            //console.log("Title: " + title);

            // Log the data type of the title variable
            //console.log("Type of title: " + typeof(title));

            // Check if the URL or title has been visited
            if (!visitedUrls.has(res.request.uri.href) || !visitedTitles.has(title)) {
                // Output the extracted content
                console.log("URL: " + res.request.uri.href);
                console.log("Keywords: " + $("meta[name=Keywords]").attr("content"));
                console.log("\n\n");
                console.log("Description: " + $("meta[name=Description]").attr("content"));
                console.log("\n\n");
                console.log("Title: " + $("title").text());
                console.log("\n\n");
                //console.log("Body: " + $("body").text());
                console.log("Paragraphs: " + $("p").text());
                console.log("Links Text: " + $("a").text());  
                console.log("--------------------------------------------------");
                pageCount++;
                console.log(pageCount)
                visitedUrls.add(res.request.uri.href); // Add the visited URL to the set
                visitedTitles.add(title); // Add the visited title to the set
                //console.log(visitedUrls)
                // Find and crawl links on this page
                let links = $("a");
                $(links).each(function (i, link) {
                    const href = $(link).attr("href");
                    if (href) {
                        // Convert relative URLs to absolute URLs
                        const absoluteUrl = url.resolve(res.request.uri.href, href);
                        // Queue the URL for crawling
                        c.queue(absoluteUrl);
                    }
                });
            }
        }
        done();
    },
});

c.on('drain', function () {
    console.log(`Crawling is complete. Total pages crawled: ${pageCount}`);
});

// Start crawling from the seed URL
c.queue('https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html');
