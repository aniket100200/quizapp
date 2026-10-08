let appData = null; // Will hold the fetched JSON

const state = {
    view: 'subjects', // loading, subjects, topics, tests, quiz, results
    history: [],
    selection: {
        subjectId: null,
        topicId: null,
        testId: null
    },
    quiz: {
        questions: [],
        currentIndex: 0,
        userAnswers: []
    }
};

const container = document.getElementById('app-container');
const breadcrumbs = document.getElementById('breadcrumbs');
const backBtnContainer = document.getElementById('back-btn-container');

async function fetchQuizData() {
    try {
        // Fetching the separated JSON file dynamically
        const response = await fetch('data/quiz_catalog.json');
        appData = await response.json();

        // Once data is loaded, render the initial view
        state.view = 'subjects';
        render();
    } catch (error) {
        console.error("Error loading JSON data:", error);
        container.innerHTML = `
            <div class="text-center text-red-500 py-12">
                <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 class="text-2xl font-bold mb-2">Failed to load data</h2>
                <p>Please refresh the page to try again.</p>
            </div>`;
    }
}

function getSubject(id) {
    return appData.subjects.find(s => s.id === id);
}

function getTopic(subjId, topicId) {
    const subject = getSubject(subjId);
    return subject ? subject.topics.find(t => t.id === topicId) : null;
}

function getTest(subjId, topicId, testId) {
    const topic = getTopic(subjId, topicId);
    return topic ? topic.tests.find(t => t.id === testId) : null;
}

function navigate(toView, selectionUpdates = {}) {
    // Don't push results view to history
    if (state.view !== 'results' && toView !== 'results') {
        state.history.push({
            view: state.view,
            selection: JSON.parse(JSON.stringify(state.selection))
        });
    }

    state.view = toView;
    state.selection = { ...state.selection, ...selectionUpdates };
    render();
}

function goBack() {
    if (state.history.length === 0) return;
    const previousState = state.history.pop();
    state.view = previousState.view;
    state.selection = previousState.selection;
    render();
}

function resetApp() {
    state.history = [];
    state.selection = { subjectId: null, topicId: null, testId: null };
    state.view = 'subjects';
    render();
}

function render() {
    if (!appData) return; // Guard clause if data isn't loaded

    container.classList.remove('justify-center');
    container.innerHTML = '';
    updateHeader();

    let viewHTML = '';
    switch(state.view) {
        case 'subjects': viewHTML = renderSubjects(); break;
        case 'topics': viewHTML = renderTopics(); break;
        case 'tests': viewHTML = renderTests(); break;
        case 'quiz': viewHTML = renderQuiz(); break;
        case 'results': viewHTML = renderResults(); break;
    }

    container.innerHTML = `<div class="fade-in w-full">${viewHTML}</div>`;

    if (state.view === 'quiz') bindQuizEvents();
}

function updateHeader() {
    backBtnContainer.className = (state.view === 'subjects' || state.view === 'results') ? 'hidden' : '';

    let crumbs = `<span class="cursor-pointer hover:text-indigo-600 transition flex items-center gap-1" onclick="resetApp()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        Home
    </span>`;

    if (state.selection.subjectId) {
        const sub = getSubject(state.selection.subjectId);
        if (sub) crumbs += ` <span class="mx-1 text-slate-300">/</span> <span class="truncate max-w-[120px] sm:max-w-none">${sub.title}</span>`;
    }
    if (state.selection.topicId) {
        const top = getTopic(state.selection.subjectId, state.selection.topicId);
        if (top) crumbs += ` <span class="mx-1 text-slate-300">/</span> <span class="truncate max-w-[120px] sm:max-w-none">${top.title}</span>`;
    }
    if (state.selection.testId) {
        const tst = getTest(state.selection.subjectId, state.selection.topicId, state.selection.testId);
        if (tst) crumbs += ` <span class="mx-1 text-slate-300">/</span> <span class="text-indigo-600 font-bold truncate max-w-[120px] sm:max-w-none">${tst.title}</span>`;
    }
    breadcrumbs.innerHTML = crumbs;
}

function renderSubjects() {
    let cards = appData.subjects.map(sub => `
        <button onclick="navigate('topics', {subjectId: '${sub.id}'})" class="group text-left bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full">
            <div class="text-5xl mb-4 group-hover:scale-110 transition-transform origin-left">${sub.icon}</div>
            <h3 class="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">${sub.title}</h3>
            <p class="text-sm text-slate-500 leading-relaxed">${sub.description || 'Explore topics for this subject.'}</p>
        </button>
    `).join('');

    return `
        <div class="mb-8 border-b border-slate-100 pb-4">
            <h2 class="text-2xl font-extrabold text-slate-800">Select Examination</h2>
            <p class="text-slate-500 mt-1">Choose your target stream to begin practicing.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            ${cards}
        </div>
    `;
}

function renderTopics() {
    const subject = getSubject(state.selection.subjectId);
    const topics = subject?.topics || [];

    if (topics.length === 0) {
        return `
            <div class="text-center py-16 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <svg class="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <h3 class="text-lg font-medium text-slate-700">Content coming soon</h3>
                <p class="text-slate-500 mt-1">Topics for ${subject.title} are currently being updated.</p>
            </div>`;
    }

    let cards = topics.map(topic => `
        <button onclick="navigate('tests', {topicId: '${topic.id}'})" class="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all group w-full text-left outline-none focus:ring-2 focus:ring-indigo-500">
            <div>
                <h4 class="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">${topic.title}</h4>
                <span class="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    ${topic.tests ? topic.tests.length : 0} Tests Available
                </span>
            </div>
            <div class="text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
        </button>
    `).join('');

    return `
        <div class="mb-8 border-b border-slate-100 pb-4">
            <h2 class="text-2xl font-extrabold text-slate-800">${subject.title} Topics</h2>
            <p class="text-slate-500 mt-1">Select a specific topic area to view tests.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${cards}
        </div>
    `;
}

function renderTests() {
    const topic = getTopic(state.selection.subjectId, state.selection.topicId);
    const tests = topic?.tests || [];

    if (tests.length === 0) {
        return `
            <div class="text-center py-16 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <h3 class="text-lg font-medium text-slate-700">No Tests Available</h3>
                <p class="text-slate-500 mt-1">Tests for ${topic.title} are being prepared.</p>
            </div>`;
    }

    let cards = tests.map(test => {
        const qCount = test.questions ? test.questions.length : 0;
        const disableBtn = qCount === 0;

        return `
        <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between hover:border-indigo-200 hover:shadow-sm transition-all group">
            <div class="mb-4 md:mb-0">
                <h4 class="text-xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">${test.title}</h4>
                <div class="flex items-center space-x-4 text-sm text-slate-500 mt-2 font-medium">
                    <span class="flex items-center bg-slate-50 px-2 py-1 rounded"><svg class="w-4 h-4 mr-1.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${test.duration}</span>
                    <span class="flex items-center bg-slate-50 px-2 py-1 rounded"><svg class="w-4 h-4 mr-1.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg> ${qCount} Questions</span>
                </div>
            </div>
            <button
                onclick="startQuiz('${test.id}')"
                ${disableBtn ? 'disabled' : ''}
                class="${disableBtn ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95'} px-6 py-2.5 rounded-lg font-bold transition-all w-full md:w-auto text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                ${disableBtn ? 'Coming Soon' : 'Start Test'}
            </button>
        </div>
    `}).join('');

    return `
        <div class="mb-8 border-b border-slate-100 pb-4">
            <h2 class="text-2xl font-extrabold text-slate-800">${topic.title} Tests</h2>
            <p class="text-slate-500 mt-1">Ready to practice? Select a module to begin.</p>
        </div>
        <div class="space-y-4">
            ${cards}
        </div>
    `;
}

function startQuiz(testId) {
    const test = getTest(state.selection.subjectId, state.selection.topicId, testId);

    if (!test || !test.questions || test.questions.length === 0) {
        showModal('Quiz Error', 'Quiz content is currently unavailable.');
        return;
    }

    state.quiz.questions = test.questions;
    state.quiz.currentIndex = 0;
    state.quiz.userAnswers = new Array(test.questions.length).fill(null);

    navigate('quiz', { testId: testId });
}

function renderQuiz() {
    const q = state.quiz.questions[state.quiz.currentIndex];
    const total = state.quiz.questions.length;
    const currentNum = state.quiz.currentIndex + 1;
    const progressPct = (currentNum / total) * 100;

    let optionsHTML = q.options.map((opt, idx) => {
        const isSelected = state.quiz.userAnswers[state.quiz.currentIndex] === opt;
        return `
            <button data-option="${opt}" class="quiz-option option-btn w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all ${isSelected ? 'selected' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'}">
                <div class="flex items-start">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 font-bold text-slate-500 mr-4 shadow-sm flex-shrink-0 option-letter transition-colors">
                        ${String.fromCharCode(65 + idx)}
                    </span>
                    <span class="mt-1">${opt}</span>
                </div>
            </button>
        `;
    }).join('');

    return `
        <div class="max-w-3xl mx-auto w-full">
            <!-- Progress Bar -->
            <div class="mb-8">
                <div class="flex justify-between text-sm font-bold text-slate-500 mb-2">
                    <span class="uppercase tracking-wider text-xs">Question ${currentNum} of ${total}</span>
                    <span>${Math.round(progressPct)}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div class="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" style="width: ${progressPct}%"></div>
                </div>
            </div>

            <!-- Question Text -->
            <div class="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 class="text-lg md:text-xl text-slate-800 leading-relaxed font-medium">${q.q}</h3>
            </div>

            <!-- Options Container -->
            <div class="space-y-3 mb-10" id="options-container">
                ${optionsHTML}
            </div>

            <!-- Bottom Controls -->
            <div class="flex justify-between items-center pt-6 border-t border-slate-100">
                <button onclick="prevQuestion()" class="${state.quiz.currentIndex === 0 ? 'invisible' : ''} px-6 py-2.5 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-200">
                    Previous
                </button>

                ${state.quiz.currentIndex === total - 1
                    ? `<button onclick="confirmSubmit()" class="bg-green-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-green-700 transition shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">Submit Test</button>`
                    : `<button onclick="nextQuestion()" class="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Next Question</button>`
                }
            </div>
        </div>
    `;
}

function bindQuizEvents() {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const selectedVal = e.currentTarget.getAttribute('data-option');
            state.quiz.userAnswers[state.quiz.currentIndex] = selectedVal;

            // Visual update without full DOM re-render
            options.forEach(o => {
                o.classList.remove('selected', 'border-slate-200', 'hover:border-indigo-300', 'hover:bg-slate-50', 'text-slate-700');
                const letterSpan = o.querySelector('.option-letter');
                letterSpan.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600');
                letterSpan.classList.add('bg-white', 'text-slate-500', 'border-slate-200');

                if(o.getAttribute('data-option') === selectedVal) {
                    o.classList.add('selected');
                    letterSpan.classList.remove('bg-white', 'text-slate-500', 'border-slate-200');
                    letterSpan.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600');
                } else {
                    o.classList.add('border-slate-200', 'hover:border-indigo-300', 'hover:bg-slate-50', 'text-slate-700');
                }
            });
        });
    });
}

function nextQuestion() {
    if (state.quiz.currentIndex < state.quiz.questions.length - 1) {
        state.quiz.currentIndex++;
        render();
    }
}

function prevQuestion() {
    if (state.quiz.currentIndex > 0) {
        state.quiz.currentIndex--;
        render();
    }
}

function confirmSubmit() {
    const unansCount = state.quiz.userAnswers.filter(a => a === null).length;
    let msg = unansCount > 0
        ? `You have ${unansCount} unanswered question(s). Are you sure you want to submit?`
        : `Are you sure you want to submit your test?`;

    showModal('Submit Assessment', msg, true, () => {
        navigate('results');
    });
}

function showModal(title, message, showCancel = false, onConfirm = null) {
    const modalHtml = `
        <div id="custom-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm fade-in">
            <div class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center transform scale-100 transition-transform">
                <h3 class="text-xl font-bold text-slate-900 mb-2">${title}</h3>
                <p class="text-slate-600 mb-6">${message}</p>
                <div class="flex justify-center gap-3">
                    ${showCancel ? `<button onclick="closeModal()" class="px-5 py-2.5 rounded-lg text-slate-700 font-medium bg-slate-100 hover:bg-slate-200 transition">Cancel</button>` : ''}
                    <button id="modal-confirm" class="px-5 py-2.5 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition shadow-sm">Confirm</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('modal-confirm').onclick = () => {
        closeModal();
        if(onConfirm) onConfirm();
    };
}

function closeModal() {
    const m = document.getElementById('custom-modal');
    if(m) m.remove();
}

function renderResults() {
    let correctCount = 0;
    const total = state.quiz.questions.length;

    const resultsHTML = state.quiz.questions.map((q, idx) => {
        const userAns = state.quiz.userAnswers[idx];
        const isCorrect = userAns === q.answer;
        if (isCorrect) correctCount++;

        const statusColor = isCorrect ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200';
        const statusIcon = isCorrect
            ? `<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></div>`
            : `<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></div>`;

        return `
            <div class="p-5 rounded-xl border ${statusColor} mb-4 flex flex-col sm:flex-row gap-4 shadow-sm">
                <div class="flex-shrink-0 mt-1">${statusIcon}</div>
                <div class="flex-grow">
                    <h4 class="text-slate-800 font-medium mb-3 leading-relaxed">${q.q}</h4>
                    <div class="text-sm bg-white p-3 rounded-lg border border-slate-100 space-y-2">
                        <div class="flex flex-col sm:flex-row sm:items-center gap-1">
                            <span class="text-slate-500 font-medium min-w-[120px]">Your Answer:</span>
                            <span class="${isCorrect ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}">${userAns || '<span class="italic text-slate-400 font-normal">Skipped</span>'}</span>
                        </div>
                        ${!isCorrect ? `
                        <div class="flex flex-col sm:flex-row sm:items-center gap-1 pt-2 border-t border-slate-50">
                            <span class="text-slate-500 font-medium min-w-[120px]">Correct Answer:</span>
                            <span class="text-green-700 font-bold">${q.answer}</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const scorePct = (correctCount / total) * 100;
    let feedback = "Good Effort!";
    let feedbackColor = "text-indigo-600";
    if(scorePct === 100) { feedback = "Outstanding! Perfect Score!"; feedbackColor = "text-green-600"; }
    else if(scorePct >= 80) { feedback = "Great Job!"; feedbackColor = "text-indigo-600"; }
    else if(scorePct < 50) { feedback = "Needs more practice."; feedbackColor = "text-amber-600"; }

    const testMeta = getTest(state.selection.subjectId, state.selection.topicId, state.selection.testId);

    return `
        <div class="max-w-3xl mx-auto w-full">
            <div class="text-center mb-10 pb-10 border-b border-slate-100">
                <div class="relative inline-flex items-center justify-center mb-6">
                    <svg class="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="60" stroke="currentColor" stroke-width="8" fill="transparent" class="text-slate-100" />
                        <circle cx="64" cy="64" r="60" stroke="currentColor" stroke-width="8" fill="transparent" stroke-dasharray="${2 * Math.PI * 60}" stroke-dashoffset="${2 * Math.PI * 60 * (1 - scorePct/100)}" class="${scorePct >= 50 ? 'text-green-500' : 'text-amber-500'} transition-all duration-1000 ease-out" />
                    </svg>
                    <div class="absolute inset-0 flex flex-col items-center justify-center">
                        <span class="text-3xl font-extrabold text-slate-800">${correctCount}<span class="text-lg text-slate-400 font-medium">/${total}</span></span>
                    </div>
                </div>
                <h2 class="text-3xl font-extrabold text-slate-900 mb-2">${feedback}</h2>
                <p class="text-slate-500">You completed <span class="font-bold text-slate-700">${testMeta.title}</span>.</p>
            </div>

            <div class="mb-10">
                <h3 class="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    Detailed Review
                </h3>
                ${resultsHTML}
            </div>

            <div class="text-center">
                <button onclick="resetApp()" class="bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
                    Return to Dashboard
                </button>
            </div>
        </div>
    `;
}

window.onload = () => {
    // Initiate data fetch
    fetchQuizData();
};