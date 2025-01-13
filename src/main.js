// Quiz settings and state management
const quizState = {
    settings: {
        difficultyLevel: {
            options: ["Easy", "Medium", "Hard"],
            selected: "Medium"
        },
        questionTypes: {
            options: ["True/False", "Multiple Choice", "Both"],
            selected: "Both"
        },
        answerExplanations: {
            options: ["Yes", "No"],
            selected: "No"
        },
        questionCount: {
            options: [5, 10, 15, 20],
            selected: 10
        },
        quizMode: {
            options: ["Timed", "Untimed"],
            selected: "Untimed",
            timePerQuestion: 30
        },
        reviewMode: {
            options: ["Review at End", "Review One by One"],
            selected: "Review at End"
        },
        randomization: {
            options: ["Randomize", "Fixed Order"],
            selected: "Randomize"
        },
        aiModel: {
            options: ["Gemini"],
            selected: "Gemini"
        },
        apiKey: {
            value: "",
            placeholder: "Enter your API key"
        }
    },
    currentQuiz: {
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: [],
        timer: null
    }
};

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('quizSettings');
    if (savedSettings) {
        quizState.settings = JSON.parse(savedSettings);
        updateSettingsUI();
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('quizSettings', JSON.stringify(quizState.settings));
}

// Update UI based on settings
function updateSettingsUI() {
    $('#difficulty').val(quizState.settings.difficultyLevel.selected);
    $('#question-types').val(quizState.settings.questionTypes.selected);
    $('#question-count').val(quizState.settings.questionCount.selected);
    $('#quiz-mode').val(quizState.settings.quizMode.selected);
    $('#time-per-question').val(quizState.settings.quizMode.timePerQuestion);
    $('#api-key').val(quizState.settings.apiKey.value);
}

// Generate quiz questions using Gemini API
async function generateQuestions(topic, customContent = '') {
    const apiKey = quizState.settings.apiKey.value;
    if (!apiKey) {
        alert('Please enter your Gemini API key in settings');
        return;
    }

    // Construct prompt for Gemini API
    const prompt = `Generate a quiz based on the following settings:
        - Topic: ${topic}
        ${customContent ? `- Custom Content: ${customContent}` : ''}
        - Difficulty Level: ${quizState.settings.difficultyLevel.selected}
        - Question Types: ${quizState.settings.questionTypes.selected}
        - Number of Questions: ${quizState.settings.questionCount.selected}`;

    try {
        // TODO: Implement Gemini API call here
        // For now, return mock questions
        return getMockQuestions();
    } catch (error) {
        console.error('Error generating questions:', error);
        alert('Failed to generate questions. Please try again.');
    }
}

// Mock questions for testing
function getMockQuestions() {
    return {
        questions: [
            {
                id: 1,
                type: "multiple_choice",
                question: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correctAnswer: "Paris",
                explanation: "Paris is the capital and largest city of France."
            },
            {
                id: 2,
                type: "true_false",
                question: "The Earth is flat.",
                options: ["True", "False"],
                correctAnswer: "False",
                explanation: "The Earth is approximately spherical in shape."
            }
        ]
    };
}

// Handle quiz navigation
function showQuestion(index) {
    const question = quizState.currentQuiz.questions[index];
    $('#question-text').text(question.question);
    
    const optionsHtml = question.options.map((option, i) => `
        <div class="option">
            <input type="${question.type === 'multiple_choice' ? 'radio' : 'radio'}" 
                   name="answer" 
                   id="option${i}" 
                   value="${option}">
            <label for="option${i}">${option}</label>
        </div>
    `).join('');
    
    $('#options-container').html(optionsHtml);
}

// Initialize quiz timer
function startTimer() {
    if (quizState.settings.quizMode.selected === 'Timed') {
        const timeLimit = quizState.settings.quizMode.timePerQuestion;
        let timeLeft = timeLimit;
        
        $('#timer').show();
        $('#time-left').text(timeLeft);
        
        quizState.currentQuiz.timer = setInterval(() => {
            timeLeft--;
            $('#time-left').text(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(quizState.currentQuiz.timer);
                moveToNextQuestion();
            }
        }, 1000);
    }
}

// Move to next question
function moveToNextQuestion() {
    if (quizState.currentQuiz.timer) {
        clearInterval(quizState.currentQuiz.timer);
    }
    
    const currentAnswer = $('input[name="answer"]:checked').val();
    quizState.currentQuiz.userAnswers[quizState.currentQuiz.currentQuestionIndex] = currentAnswer;
    
    if (quizState.currentQuiz.currentQuestionIndex < quizState.currentQuiz.questions.length - 1) {
        quizState.currentQuiz.currentQuestionIndex++;
        showQuestion(quizState.currentQuiz.currentQuestionIndex);
        startTimer();
    } else {
        showResults();
    }
}

// Show quiz results
function showResults() {
    const totalQuestions = quizState.currentQuiz.questions.length;
    let correctAnswers = 0;
    
    quizState.currentQuiz.questions.forEach((question, index) => {
        if (quizState.currentQuiz.userAnswers[index] === question.correctAnswer) {
            correctAnswers++;
        }
    });
    
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    $('#score').text(`${score}% (${correctAnswers}/${totalQuestions})`);
    
    const reviewHtml = quizState.currentQuiz.questions.map((question, index) => `
        <div class="answer-review ${quizState.currentQuiz.userAnswers[index] === question.correctAnswer ? 'correct' : 'incorrect'}">
            <p><strong>Question ${index + 1}:</strong> ${question.question}</p>
            <p>Your answer: ${quizState.currentQuiz.userAnswers[index] || 'Not answered'}</p>
            <p>Correct answer: ${question.correctAnswer}</p>
            ${question.explanation ? `<p><em>Explanation: ${question.explanation}</em></p>` : ''}
        </div>
    `).join('');
    
    $('#answers-review').html(reviewHtml);
    $.mobile.changePage('#results');
}

// Event handlers
$(document).ready(function() {
    // Load saved settings
    loadSettings();
    
    // Topic selection handling
    $('#topic-select').on('change', function() {
        if ($(this).val() === 'custom') {
            $('#custom-content-container').show();
        } else {
            $('#custom-content-container').hide();
        }
    });
    
    // Start quiz
    $('#start-quiz').on('click', async function() {
        const topic = $('#topic-select').val();
        const customContent = $('#custom-content').val();
        
        if (!topic) {
            alert('Please select a topic');
            return;
        }
        
        const questions = await generateQuestions(topic, customContent);
        quizState.currentQuiz.questions = questions.questions;
        quizState.currentQuiz.currentQuestionIndex = 0;
        quizState.currentQuiz.userAnswers = [];
        
        showQuestion(0);
        startTimer();
    });
    
    // Navigation buttons
    $('#prev-question').on('click', function() {
        if (quizState.currentQuiz.currentQuestionIndex > 0) {
            quizState.currentQuiz.currentQuestionIndex--;
            showQuestion(quizState.currentQuiz.currentQuestionIndex);
        }
    });
    
    $('#next-question').on('click', moveToNextQuestion);
    
    // Settings form
    $('#settings-form').on('submit', function(e) {
        e.preventDefault();
        quizState.settings.difficultyLevel.selected = $('#difficulty').val();
        quizState.settings.questionTypes.selected = $('#question-types').val();
        quizState.settings.questionCount.selected = parseInt($('#question-count').val());
        quizState.settings.quizMode.selected = $('#quiz-mode').val();
        quizState.settings.quizMode.timePerQuestion = parseInt($('#time-per-question').val());
        quizState.settings.apiKey.value = $('#api-key').val();
        
        saveSettings();
        alert('Settings saved successfully');
    });
    
    // Quiz mode changes
    $('#quiz-mode').on('change', function() {
        if ($(this).val() === 'Timed') {
            $('#time-settings').show();
        } else {
            $('#time-settings').hide();
        }
    });
    
    // Import/Export
    $('#export-settings').on('click', function() {
        const settingsJson = JSON.stringify(quizState.settings, null, 2);
        const blob = new Blob([settingsJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'quiz-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    $('#import-settings').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedSettings = JSON.parse(e.target.result);
                    quizState.settings = importedSettings;
                    saveSettings();
                    updateSettingsUI();
                    alert('Settings imported successfully');
                } catch (error) {
                    alert('Error importing settings. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
    });
});