# COMP 4601 Assignment

## NOTE FOR TESTING
crawly.js is the crawler for fruits, and crawly2 is the crawler for personal (wiki) pages. You can run them seperately, and they will create two different collections in the same database.

## Group Members

Nirmith D'Almeida 101160124 nirmithdalmeida@cmail.carleton.ca
Johnathan Scaife 101145480 johnscaife@cmail.carleton.ca
Ali Hassan Sharif 101142782 alisharif@cmail.carleton.ca

## OpenStack URL

http://134.117.135.26:3000

## Video URL

https://www.youtube.com/watch?v=Kt82suIoy0E

## Implemented Features

1. Web Crawler
   a) Fruit example site
   b) Wikipedia
   Stored in database with page data and PageRank calculations

2. RESTful Web Server
   a) / - Home page displays entire collection
   b) /search - Page to specify search parameters
   c) /fruits - Search results from fruits collection (supports JSON via Postman)
   d) /fruits/:id - Data on individual fruit page
   e) /personal - Search results from personal (wikipedia) collection (Supports JSON via Postman)
   f) /personal/:id - Data on individual personal (wikipedia) page

Both /fruits and /personal has the following query parameters:
a) q - String representing the search query
b) boost - true or false, indicating boost from pagerank
c) limit - the number of search results you want returned 0<limit<51

3. OpenStack Deployment
   a) Server deployed to OpenStack
   b) PUT request to distributed search engine using AXIOS

## Video/Demonstration

1. How does your crawler work? What information does it extract from the page? How does
   it store the data? Is there any intermediary processing you perform to facilitate the later
   steps of the assignment?
2. Discuss the RESTful design of your server. How has your implementation incorporated
   the various REST principles?
3. Explain how the content score for the search is generated.
4. Discuss the PageRank calculation and how you have implemented it.
5. How have you defined your page selection policy for your crawler for your personal site?
6. Why did you select the personal site you chose? Did you run into any problems when
   working with this site? How did you address these problems?
7. Critique your search engine. How well does it work? How well will it scale? How do you
   think it could be improved?
