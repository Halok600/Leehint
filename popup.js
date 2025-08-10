document.addEventListener('DOMContentLoaded', function() {
  // Get all our HTML elements
  const getHintBtn = document.getElementById('getHintBtn');
  const getHint2Btn = document.getElementById('getHint2Btn');
  const solutionButtons = document.getElementById('solution-buttons');
  const getPythonBtn = document.getElementById('getPythonBtn');
  const getJavaBtn = document.getElementById('getJavaBtn');
  const getCppBtn = document.getElementById('getCppBtn');
  const hintDisplay = document.getElementById('hint-display');
  
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
  let fullProblemText = ''; // Variable to store the problem text

  // Reusable function to call the Gemini API
  async function getGeminiResponse(prompt) {
    hintDisplay.innerHTML = 'Getting response from Gemini... 🤔'; // Use innerHTML for potential spinners later
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });
      if (!response.ok) throw new Error(`API request failed: ${response.status}`);
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      hintDisplay.innerHTML = marked.parse(text); // Parse the markdown response
      return true;
    } catch (error) {
      console.error('Error fetching from Gemini API:', error);
      hintDisplay.innerText = 'Failed to get a response. Check the console for errors.';
      return false;
    }
  }

  // Function to get a solution for a specific language
  async function getSolution(language) {
    const prompt = `You are a LeetCode assistant. A user wants the full solution to the following problem. Provide a clear, well-explained solution in ${language}, including the code and an explanation of the logic. Format the code in a markdown block. Here is the problem: ${fullProblemText}`;
    await getGeminiResponse(prompt);
  }

  // --- Event Listeners ---

  // Level 1 Hint
  getHintBtn.addEventListener('click', function() {
    hintDisplay.innerText = 'Getting problem from page...';
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getProblem' }, async function(response) {
        if (response && response.text && response.text !== 'Could not find problem text.') {
          fullProblemText = response.text;
          const prompt = `You are a LeetCode assistant... Provide a small, high-level hint... Here is the problem: ${fullProblemText}`;
          const success = await getGeminiResponse(prompt);
          if (success) {
            getHintBtn.style.display = 'none';
            getHint2Btn.style.display = 'block';
          }
        } else {
          hintDisplay.innerText = 'Error: Could not read the problem from this page.';
        }
      });
    });
  });

  // Level 2 Hint
  getHint2Btn.addEventListener('click', async function() {
    const prompt = `You are a LeetCode assistant... Provide a more detailed hint... Here is the problem: ${fullProblemText}`;
    const success = await getGeminiResponse(prompt);
    if (success) {
      getHint2Btn.style.display = 'none';
      solutionButtons.style.display = 'flex'; // Show the language buttons
    }
  });

  // Solution Buttons
  getPythonBtn.addEventListener('click', () => getSolution('Python'));
  getJavaBtn.addEventListener('click', () => getSolution('Java'));
  getCppBtn.addEventListener('click', () => getSolution('C++'));
});