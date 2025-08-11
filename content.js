chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageData") {
    // Test Message 1: Did we receive the request?
    console.log("Leehint Debug: content.js received getPageData request.");

    // Get the problem description
    const problemDiv = document.querySelector('div#qd-content');
    const problemText = problemDiv ? problemDiv.innerText : "Could not find problem text.";

    // Get the user's code from the editor
    const lineElements = document.querySelectorAll('.view-line');
    
    // Test Message 2: Did we find any code lines?
    console.log(`Leehint Debug: Found ${lineElements.length} elements with class 'view-line'.`);

    let userCode = "";
    lineElements.forEach(line => {
      userCode += line.innerText + '\n';
    });

    // Test Message 3: What does the reconstructed code look like?
    console.log("Leehint Debug: Reconstructed code is:", userCode);

    // Send both pieces of data back to the popup
    sendResponse({ 
      problemText: problemText,
      userCode: userCode 
    });
  }
  return true; 
});