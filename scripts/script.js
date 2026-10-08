// 1. Declare your constants FIRST
const subjects = [
    "Maths", "Reasoning", "History", "Geography", "Polity",
    "Economics", "general_science", "Current_Affairs", "Computer_Science", "English"
];

const quizData = [];

loadQuizData(); // Call the function to load quiz data

// 3. Define the function
function loadQuizData(pageId = 0) {
    localStorage.setItem("pageId", pageId); // Store the pageId in localStorage
    const subject = subjects[pageId];
    fetch(`data/${subject}.json`)
        .then(response => response.json())
        .then(data => {
            // Process the fetched data
            var topicList = document.getElementById("topicList");
            var currData = data;
            var topics = currData.topics;
            topics.forEach(topic => {
                var listItem = document.createElement("li");
                appendAnchorTag(topic.name, listItem);
                listItem.setAttribute("data-topic-id", topic.id);
                topicList.appendChild(listItem);
            });

            quizData.push(data); // Store the fetched data in the quizData array
            console.log("Quiz data loaded successfully:", quizData);
        }).catch(error => {
            console.error("Error loading quiz data:", error);
        });
}

function appendAnchorTag(name, listItem) {
    var anchor = document.createElement("a");
    anchor.href = "pages/quiz_app.html";
    anchor.textContent = name;
    listItem.appendChild(anchor);
}
