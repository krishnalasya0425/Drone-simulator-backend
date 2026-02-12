

function parseQuestionsFromText(fullText) {
    const questions = [];
    const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(l => l);

    let currentQuestion = null;
    let state = 'IDLE'; // IDLE, QUESTION, OPTIONS

    // Regex Helpers
    // 1. Question Start: "1. text", "Q1. text", "1) text", "Q1: text"
    const questionStartRegex = /^(?:(?:Q|Question)\s*\d*[:.)]?|(?:\d+[:.)]))\s+(.*)/i;

    // 2. Options: "A. text", "A) text", "A text" (dangerous, but sometimes needed if colon missed)
    const optionRegex = /^([A-D])\s*[:.)]\s+(.*)/i;

    // 3. Answer: "Answer: A", "Ans: A", "Key: A"
    const answerRegex = /^(?:Answer|Ans|Key|Correct Answer)\s*[:.-]?\s*(.*)/i;

    function finalizeQuestion() {
        if (currentQuestion) {
            // Validations: must have text, options, and ideally an answer
            // IF answer is missing, we might want to still accept it, or log warning?
            // For now, only push if answer exists or maybe we mark it?
            if (currentQuestion.answer) {
                questions.push(currentQuestion);
            }
            //  else {
            //     console.log("Skipping incomplete question (no answer):", currentQuestion.question_text.substring(0, 30));
            // }
            currentQuestion = null;
            state = 'IDLE';
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // --- CHECK FOR START OF NEW QUESTION ---
        const qMatch = line.match(questionStartRegex);
        if (qMatch) {
            // If we are already building a question, finalize it first
            // This handles cases where "Answer:" is missing or on same line as next question (rare but possible)
            if (currentQuestion) {
                finalizeQuestion();
            }

            // Start new
            currentQuestion = {
                question_text: qMatch[1].trim(),
                options: [],
                type: 'mcq',
                answer: null
            };
            state = 'QUESTION';
            continue;
        }

        // --- CHECK FOR ANSWER ---
        const answerMatch = line.match(answerRegex);
        if (answerMatch) {
            if (currentQuestion) {
                let rawAns = answerMatch[1].trim();
                let type = 'mcq';
                let finalAns = rawAns;

                if (rawAns.toLowerCase().includes('true')) {
                    type = 'tf'; finalAns = 'True';
                } else if (rawAns.toLowerCase().includes('false')) {
                    type = 'tf'; finalAns = 'False';
                } else {
                    const ansLetter = rawAns.match(/^([A-D])/i);
                    if (ansLetter) finalAns = ansLetter[1].toUpperCase();
                }

                currentQuestion.answer = finalAns;
                currentQuestion.type = type;

                // We don't nullify currentQuestion yet, in case there are more lines (unlikely for answer, but okay)
                // Actually better to finalize immediately to be safe
                finalizeQuestion();
            }
            continue;
        }

        // --- CHECK FOR OPTION ---
        const optionMatch = line.match(optionRegex);
        if (optionMatch) {
            if (currentQuestion) {
                state = 'OPTIONS';
                currentQuestion.options.push({
                    label: optionMatch[1].toUpperCase(),
                    text: optionMatch[2].trim()
                });
            }
            continue;
        }

        // --- CONTINUATION TEXT ---
        if (currentQuestion) {
            if (state === 'QUESTION') {
                currentQuestion.question_text += " " + line;
            } else if (state === 'OPTIONS' && currentQuestion.options.length > 0) {
                currentQuestion.options[currentQuestion.options.length - 1].text += " " + line;
            }
        }
    }

    // Finalize last question if exists
    finalizeQuestion();

    return questions;
}

module.exports = { parseQuestionsFromText };
