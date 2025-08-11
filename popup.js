document.addEventListener('DOMContentLoaded', function() {
    // Get all our HTML elements
    const getHintBtn = document.getElementById('getHintBtn');
    const getHint2Btn = document.getElementById('getHint2Btn');
    const solutionButtons = document.getElementById('solution-buttons');
    const getPythonBtn = document.getElementById('getPythonBtn');
    const getJavaBtn = document.getElementById('getJavaBtn');
    const getCppBtn = document.getElementById('getCppBtn');
    const hintDisplay = document.getElementById('hint-display');
    const resetBtn = document.getElementById('resetBtn');
    const spinner = document.getElementById('spinner');

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    let fullProblemText = '';
    let userCode = '';

    // --- State Management Functions ---

    function loadState() {
        chrome.storage.local.get(['savedHint', 'savedLevel', 'savedProblem', 'savedCode'], (result) => {
            if (result.savedHint && result.savedLevel) {
                hintDisplay.innerHTML = result.savedHint;
                fullProblemText = result.savedProblem || '';
                userCode = result.savedCode || '';
                restoreUI(result.savedLevel);
                addCopyButton();
            }
        });
    }

    function saveState(level, hintHTML, problemText, code) {
        chrome.storage.local.set({
            savedHint: hintHTML,
            savedLevel: level,
            savedProblem: problemText,
            savedCode: code,
        });
    }

    function resetState() {
        chrome.storage.local.clear(() => {
            hintDisplay.innerHTML = '';
            fullProblemText = '';
            userCode = '';
            restoreUI(0);
        });
    }

    function restoreUI(level) {
        getHintBtn.style.display = 'none';
        getHint2Btn.style.display = 'none';
        solutionButtons.style.display = 'none';

        if (level === 0) {
            getHintBtn.style.display = 'block';
        } else if (level === 1) {
            getHint2Btn.style.display = 'block';
        } else if (level === 2 || level === 3) {
            solutionButtons.style.display = 'flex';
        }
    }

    function addCopyButton() {
        const preElement = hintDisplay.querySelector('pre');
        if (preElement) {
            const existingBtn = preElement.querySelector('.copy-code-btn');
            if (existingBtn) {
                existingBtn.remove();
            }

            const copyBtn = document.createElement('button');
            copyBtn.innerText = 'Copy';
            copyBtn.className = 'copy-code-btn';

            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const codeText = preElement.querySelector('code').innerText;
                navigator.clipboard.writeText(codeText).then(() => {
                    copyBtn.innerText = 'Copied!';
                    setTimeout(() => {
                        copyBtn.innerText = 'Copy';
                    }, 2000);
                });
            });
            preElement.prepend(copyBtn);
        }
    }

    async function getGeminiResponse(prompt, levelToSave) {
        spinner.style.display = 'block';
        hintDisplay.innerHTML = '';
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            });
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            const parsedHtml = marked.parse(text);
            hintDisplay.innerHTML = parsedHtml;
            
            addCopyButton();
            
            saveState(levelToSave, hintDisplay.innerHTML, fullProblemText, userCode);
            return true;
        } catch (error) {
            console.error('Error fetching from Gemini API:', error);
            hintDisplay.innerText = 'Failed to get a response. Check the console for errors.';
            return false;
        } finally {
            spinner.style.display = 'none';
        }
    }

    async function getSolution(language) {
        const prompt = `A user is working on this problem: "${fullProblemText}". Their current code is: "${userCode}". Provide a full, corrected, and well-explained solution in ${language}.`;
        await getGeminiResponse(prompt, 3);
    }

    // --- Event Listeners ---
    resetBtn.addEventListener('click', resetState);

    getHintBtn.addEventListener('click', function() {
        hintDisplay.innerText = 'Getting problem and code from page...';
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (!tabs[0]) return;
            chrome.tabs.sendMessage(tabs[0].id, { action: "getPageData" }, async function(response) {
                if (response && response.problemText && response.problemText !== 'Could not find problem text.') {
                    fullProblemText = response.problemText;
                    userCode = response.userCode;
                    const prompt = `Provide a small, high-level hint for the following LeetCode problem. Do not give away the solution or any code: ${fullProblemText}`;
                    const success = await getGeminiResponse(prompt, 1);
                    if (success) {
                        restoreUI(1);
                    }
                } else {
                    hintDisplay.innerText = 'Error: Could not read the page data.';
                }
            });
        });
    });

    getHint2Btn.addEventListener('click', async function() {
        const prompt = `A user is working on this LeetCode problem: "${fullProblemText}". Here is the code they have written so far: "${userCode}". Based on their code, provide a targeted hint to help them find the solution. Do not give away the full answer. If their code is empty, give a hint about the general approach.`;
        const success = await getGeminiResponse(prompt, 2);
        if (success) {
            restoreUI(2);
        }
    });

    getPythonBtn.addEventListener('click', () => getSolution('Python'));
    getJavaBtn.addEventListener('click', () => getSolution('Java'));
    getCppBtn.addEventListener('click', () => getSolution('C++'));

    // --- Initial Load ---
    loadState();
});