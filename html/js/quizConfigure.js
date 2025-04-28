document.addEventListener('DOMContentLoaded', function() {
    const questionSetDropdown = document.getElementById('questionSet');

    // Fetch the list of question sets from the server
    fetch('http://localhost:3000/questionSets')
        .then(response => response.json())
        .then(questionSets => {
            questionSets.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file.replace('.json', '');
                questionSetDropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching question sets:', error);
        });
});

document.getElementById('quizConfigForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const quizTitle = document.getElementById('quizTitle').value.trim();
    const quizDescription = document.getElementById('quizDescription').value.trim();
    const questionSet = document.getElementById('questionSet').value;
    const soundPlayback = document.querySelector('input[name="soundPlayback"]:checked').value;
    const hostUsername = sessionStorage.getItem('username');

    if (!quizTitle || !quizDescription || !questionSet) {
        alert('Please fill in all fields.');
        return;
    }

    // Generate a 6-digit code
    const quizCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send the quiz configuration to the server
    fetch('http://localhost:3000/createQuiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quizTitle, quizDescription, questionSet, quizCode, hostUsername, soundPlayback })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Quiz created successfully!') {
            // Redirect to the host quiz management page with the quiz code
            window.location.href = `hostScreen.html?quizCode=${quizCode}`;
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    });
});