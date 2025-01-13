// Quiz state management
const quizState = {
  currentQuiz: {
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    timer: null,
  },
};

// Initialize quiz setup page
$(document).on("pagecreate", "#topic-selection", function () {
  console.log("Quiz setup page initialized");

  // Topic selection handling
  $("#topic-select").on("change", function () {
    if ($(this).val() === "custom") {
      $("#custom-content-container").show();
    } else {
      $("#custom-content-container").hide();
    }
  });

  // Start quiz button
  $("#start-quiz").on("click", function () {
    const topic = $("#topic-select").val();
    if (!topic) {
      alert("Please select a topic");
      return;
    }
    // Navigate to quiz section
    $.mobile.changePage("#quiz-section", {
      transition: "slide",
    });
    // Add quiz generation logic here
  });
});

// Quiz section initialization
$(document).on("pagecreate", "#quiz-section", function () {
  // Navigation buttons
  $("#prev-question").on("click", function () {
    if (quizState.currentQuiz.currentQuestionIndex > 0) {
      quizState.currentQuiz.currentQuestionIndex--;
      showQuestion(quizState.currentQuiz.currentQuestionIndex);
    }
  });

  $("#next-question").on("click", function () {
    if (
      quizState.currentQuiz.currentQuestionIndex <
      quizState.currentQuiz.questions.length - 1
    ) {
      quizState.currentQuiz.currentQuestionIndex++;
      showQuestion(quizState.currentQuiz.currentQuestionIndex);
    } else {
      // Navigate to results page
      $.mobile.changePage("#results", {
        transition: "slide",
      });
    }
  });
});

// Show question function
function showQuestion(index) {
  // Add question display logic here
  console.log("Showing question", index);
}

// Handle page navigation events
$(document).on("pagebeforeshow", "#quiz-section", function () {
  console.log("Quiz section shown");
  // Initialize quiz state when page is shown
});

$(document).on("pagebeforeshow", "#results", function () {
  console.log("Results page shown");
  // Display results when page is shown
});
