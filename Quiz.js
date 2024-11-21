document.addEventListener("DOMContentLoaded", () => {
    const questionTitle = document.getElementById("questionTitle");
    const optionsDiv = document.getElementById("options");
    const revealButton = document.getElementById("revealButton");
    const answerParagraph = document.getElementById("answer");
    const continueButton = document.getElementById("continueButton");

    let questions = [];
    let currentQuestionIndex = 0;

    // Fetch questions from the file
    fetch("./questions/questions.txt")
        .then(response => response.text())
        .then(data => {
            questions = parseQuestions(data);
            if (questions.length > 0) {
                displayQuestion();
            } else {
                questionTitle.textContent = "No questions available.";
            }
        })
        .catch(err => {
            console.error("Error loading questions:", err);
            questionTitle.textContent = "Failed to load questions.";
        });

    // Parse the text file into a structured format
    function parseQuestions(data) {
        const lines = data.split("\n").map(line => line.trim()).filter(line => line);
        const parsedQuestions = [];
        let currentQuestion = null;

        lines.forEach(line => {
            const [id, type, ...rest] = line.split("-");
            const content = rest.join("-");

            if (type === "q") {
                if (currentQuestion) parsedQuestions.push(currentQuestion);
                currentQuestion = { id, question: content, choices: [], answer: null, explanation: null };
            } else if (type === "a" || type === "b" || type === "c" || type === "d") {
                currentQuestion.choices.push({ label: type, description: content });
            } else if (type === "s") {
                const [correctAnswer, explanation] = content.split("-");
                currentQuestion.answer = correctAnswer;
                currentQuestion.explanation = explanation;
            }
        });

        if (currentQuestion) parsedQuestions.push(currentQuestion);
        return parsedQuestions;
    }

    // Display the current question
    function displayQuestion() {
        const question = questions[currentQuestionIndex];
        questionTitle.textContent = `Question ${question.id}: ${question.question}`;
        optionsDiv.innerHTML = "";
        answerParagraph.style.display = "none";
        revealButton.style.display = "block";
        continueButton.style.display = "none";

        question.choices.forEach(choice => {
            const button = document.createElement("button");
            button.textContent = `${choice.label.toUpperCase()}: ${choice.description}`;
            optionsDiv.appendChild(button);
        });

        revealButton.addEventListener("click", revealAnswer, { once: true });
        continueButton.addEventListener("click", nextQuestion, { once: true });
    }

    // Reveal the correct answer
    function revealAnswer() {
        const question = questions[currentQuestionIndex];
        answerParagraph.textContent = `Answer: ${question.answer.toUpperCase()} - ${question.explanation}`;
        answerParagraph.style.display = "block";
        revealButton.style.display = "none";
        continueButton.style.display = "block";
    }

    // Move to the next question
    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            displayQuestion();
        } else {
            questionTitle.textContent = "End of questions.";
            optionsDiv.innerHTML = "";
            revealButton.style.display = "none";
            answerParagraph.style.display = "none";
            continueButton.style.display = "none";
        }
    }
});
