function powerIteration(adjacencyMatrix, dampingFactor = 0.85, maxIterations = 100, tolerance = 0.0001) {
    const numPages = adjacencyMatrix.length;
    let pageRank = new Array(numPages).fill(1 / numPages); // Initialize with uniform distribution
  
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let newPageRank = new Array(numPages).fill(0);
  
      for (let toPage = 0; toPage < numPages; toPage++) {
        for (let fromPage = 0; fromPage < numPages; fromPage++) {
          if (adjacencyMatrix[fromPage][toPage] === 1) {
            newPageRank[toPage] += pageRank[fromPage] / sumOutgoingLinks(fromPage);
          }
        }
        newPageRank[toPage] = dampingFactor * newPageRank[toPage] + (1 - dampingFactor) / numPages;
      }
  
      // Check for convergence
      let maxChange = 0;
      for (let i = 0; i < numPages; i++) {
        maxChange = Math.max(maxChange, Math.abs(newPageRank[i] - pageRank[i]));
      }
  
      if (maxChange < tolerance) {
        return newPageRank;
      }
  
      pageRank = newPageRank;
    }
  
    return pageRank;
  }
  
  // Helper function to calculate the number of outgoing links from a page
  function sumOutgoingLinks(pageIndex) {
    let sum = 0;
    for (let i = 0; i < adjacencyMatrix.length; i++) {
      sum += adjacencyMatrix[pageIndex][i];
    }
    return sum;
  }
  
  // Example adjacency matrix representing page links (1 indicates a link)
  const adjacencyMatrix = [
    [0, 1, 0],
    [1, 0, 1],
    [1, 0, 0],
  ];
  
  const result = powerIteration(adjacencyMatrix);
  console.log(result);