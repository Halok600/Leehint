// This script runs on the LeetCode page.
// It listens for a message from our popup script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is the one we're looking for
  if (request.action === "getProblem") {
    // Find the HTML element that contains the problem description
    const problemDiv = document.querySelector('div#qd-content');
    
    // Grab the text from that element
    const problemText = problemDiv ? problemDiv.innerText : "Could not find problem text.";
    
    // Send the text back to the popup script
    sendResponse({ text: problemText });
  }
});