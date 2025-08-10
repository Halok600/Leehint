document.addEventListener('DOMContentLoaded', function() {
  // --- PASTE YOUR API KEY HERE ---
  
  // -----------------------------

  const getHintBtn = document.getElementById('getHintBtn');
  const hintDisplay = document.getElementById('hint-display');
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  // This function sends the problem text to Gemini
  async function getGeminiHint(problemText) {
    hintDisplay.innerText = 'Getting hint from Gemini... 🤔';
    
    // This is the prompt we send to the AI
    const prompt = `You are a LeetCode assistant. A user is stuck on the following problem. Provide a small, high-level hint to get them started. Do not give away the solution or any code. Here is the problem: ${problemText}`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const hint = data.candidates[0].content.parts[0].text;
      hintDisplay.innerText = hint; // Display the hint in our popup!
    } catch (error) {
      console.error('Error fetching from Gemini API:', error);
      hintDisplay.innerText = 'Failed to get a hint. Check the console for errors.';
    }
  }

  // Updated button click listener
  getHintBtn.addEventListener('click', function() {
    hintDisplay.innerText = 'Getting problem from page...';
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getProblem' }, function(response) {
        if (response && response.text && response.text !== 'Could not find problem text.') {
          // If we successfully get the text, call our new Gemini function
          getGeminiHint(response.text);
        } else {
          console.error('FAILED: Could not find problem text on the page.');
          hintDisplay.innerText = 'Error: Could not read the problem from this page.';
        }
      });
    });
  });
});