document.getElementById('quizCodeInput').addEventListener('input', function() {
    const inputField = document.getElementById('quizCodeInput');
    const joinButton = document.getElementById('joinQuizButton');
    
    // Remove non-numeric characters
    inputField.value = inputField.value.replace(/\D/g, '');

    // Limit input to 6 digits
    inputField.value = inputField.value.slice(0, 6);

    if (inputField.value.length === 6) {
        joinButton.style.display = 'block';
    } else {
        joinButton.style.display = 'none';
    }
});

document.getElementById('joinQuizButton').addEventListener('click', function() {
    const quizCode = document.getElementById('quizCodeInput').value.trim();
    const username = sessionStorage.getItem('username');

    if (!quizCode || !username) {
        alert('Please enter a quiz code and make sure you are logged in.');
        return;
    }

    fetch('http://localhost:3000/joinQuiz', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quizCode, username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Joined quiz successfully!') {
            alert('Joined quiz successfully!');
            // Redirect to player UI or quiz screen
            window.location.href = `playerUI.html?quizCode=${quizCode}`;
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    });
});