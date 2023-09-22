## Lab 3

- Crawler Requirements

1. Store the content from each page within a database.
2. Store a representation of the network of pages (i.e., which pages link to other pages) within the database. You may store this data in any format you decide is appropriate, such as incoming/outgoing link information stored within each page document, stored as a separate document, stored as a separate collection with link documents, etc.. It is advisable to read the remainder of the requirements below to inform your decisions on data structure and storage.

3. Avoid crawling the same page more than once (i.e., do not re-visit pages).

- RESTFUL Requirements

1. GET /popular – Returns the 10 pages with the highest number of incoming links (i.e., the pages that receive links from other pages the most). The information within the response must allow the client to then request data about any of these 10 pages (see below for required information for each single page resource).
2. If the client requests information about a single page X, the response must contain:
   a. The URL that this resource corresponds to (note: the ID of the page in your RESTful system does not have to match the URL of the page it belongs to)
   b. A list of the pages that link to the page X
