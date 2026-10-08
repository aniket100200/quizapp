
    
    // --- 1. Quiz Data (Hardcoded as requested) ---
    const quizData = loadQuizData();
    

    // Object to store user's selected answers { questionId: selectedIndex }
    let userAnswers = {};

    // --- 2. Initialization & Rendering ---
    window.onload = function() {
        document.getElementById('subject-title').innerText = quizData.subjectName;
        renderQuiz();
    };

    function renderQuiz() {
        const container = document.getElementById('quiz-container');
        let htmlContent = '';

        quizData.topics.forEach((topic) => {
            // Topic Header
            htmlContent += `
                <div class="mb-8">
                    <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <span class="w-2 h-6 bg-blue-500 rounded-full mr-2"></span>
                        ${topic.topicName}
                    </h2>
                    <div class="space-y-4">
            `;

            // Questions Loop
            topic.questions.forEach((q, index) => {
                htmlContent += `
                    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                        <p class="font-semibold text-slate-800 mb-4 leading-relaxed">${index + 1}. ${q.questionText}</p>
                        <div class="space-y-3">
                `;

                // Options Loop
                q.options.forEach((opt, optIndex) => {
                    const inputId = `q_${q.questionId}_opt_${optIndex}`;
                    const name = `q_${q.questionId}`;

                    // Using custom styled labels for large, tappable touch targets
                    htmlContent += `
                        <label for="${inputId}" class="flex items-center p-3 rounded-lg border border-slate-200 cursor-pointer transition-colors hover:bg-slate-50 active:bg-slate-100 group has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
                            <input type="radio" id="${inputId}" name="${name}" value="${optIndex}" class="hidden peer" onchange="saveAnswer('${q.questionId}', ${optIndex})">
                            <div class="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center mr-3 transition-colors">
                                <div class="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                            </div>
                            <span class="text-slate-700 peer-checked:text-slate-900 peer-checked:font-medium">${opt}</span>
                        </label>
                    `;
                });

                htmlContent += `</div></div>`;
            });

            htmlContent += `</div></div>`;
        });

        container.innerHTML = htmlContent;
    }

    // --- 3. Logic & Interactions ---
    function saveAnswer(questionId, selectedIndex) {
        userAnswers[questionId] = selectedIndex;
    }

    function submitQuiz() {
        // Hide quiz view and sticky footer, show results view
        document.getElementById('quiz-view').classList.add('hidden');
        document.getElementById('submit-footer').classList.add('hidden');
        document.getElementById('results-view').classList.remove('hidden');

        // Scroll to top to see score
        window.scrollTo({ top: 0, behavior: 'smooth' });

        calculateAndShowResults();
    }

    function calculateAndShowResults() {
        let score = 0;
        let totalQuestions = 0;
        let breakdownHTML = '';

        quizData.topics.forEach(topic => {
            topic.questions.forEach(q => {
                totalQuestions++;
                const userSelectedIdx = userAnswers[q.questionId];
                const isCorrect = userSelectedIdx === q.correctAnswerIndex;

                if (isCorrect) {
                    score++;
                }

                // Build visual breakdown for each question
                const borderClass = isCorrect ? 'border-green-500' : 'border-red-500';
                const icon = isCorrect ? '✅' : '❌';
                const userAnswerText = userSelectedIdx !== undefined ? q.options[userSelectedIdx] : '<span class="text-slate-400 italic">No answer provided</span>';
                const correctAnswerText = q.options[q.correctAnswerIndex];

                breakdownHTML += `
                    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-4 border-l-4 ${borderClass}">
                        <p class="font-semibold text-slate-800 mb-3">${icon} ${q.questionText}</p>

                        <div class="space-y-1 text-sm">
                            <p class="text-slate-600">Your answer: <span class="font-medium text-slate-800">${userAnswerText}</span></p>
                            ${!isCorrect ? `<p class="text-slate-600">Correct answer: <span class="font-medium text-green-600">${correctAnswerText}</span></p>` : ''}
                        </div>
                    </div>
                `;
            });
        });

        // Update DOM with results
        document.getElementById('score-display').innerText = `You scored ${score} out of ${totalQuestions}`;
        document.getElementById('breakdown-container').innerHTML = breakdownHTML;

        // Optional: You could call a Java interface method here to pass the score back to Android
        // if (window.AndroidInterface) { window.AndroidInterface.sendScore(score, totalQuestions); }
    }
