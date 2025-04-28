document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quizCode');
    document.getElementById('quizCode').textContent = quizCode;

    sessionStorage.setItem('quizCode', quizCode);

    const teamNameForm = document.getElementById('teamNameForm');
    const soundSelectionForm = document.getElementById('soundSelectionForm');
    const soundDropdown = document.getElementById('winningSound');
    const audioPlayer = document.createElement('audio');
    document.body.appendChild(audioPlayer);
    const previewContainer = document.getElementById('previewContainer');
    const previewButton = document.getElementById('previewButton');
    const nextButton = document.getElementById('nextButton');

    // WebSocket connection
    const username = sessionStorage.getItem('username');
    const ws = new WebSocket(`ws://localhost:3000?username=${username}`);

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message.message === 'You have been removed from the quiz.') {
            alert(message.message);
            window.location.href = 'index.html';
        } else if (message.message === 'The quiz has started!') {
            window.location.href = `playerQuiz.html?quizCode=${quizCode}`;
        }
    };

    teamNameForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const teamName = document.getElementById('teamName').value.trim();

        if (!teamName || !username) {
            alert('Please enter a team name and make sure you are logged in.');
            return;
        }

        fetch('http://localhost:3000/saveTeamName', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'username': username,
                'quizcode': quizCode
            },
            body: JSON.stringify({ teamName })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error('Network response was not ok: ' + errorData.message);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.message === 'Team name saved successfully!') {
                alert('Team name saved successfully!');
                teamNameForm.style.display = 'none';
                soundSelectionForm.style.display = 'block';
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        });
    });

    // Fetch the list of sounds from the server
    fetch('http://localhost:3000/sounds')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(sounds => {
            // Populate the dropdown with the sounds
            sounds.forEach(sound => {
                const option = document.createElement('option');
                option.value = sound.file;
                option.textContent = `${sound.label} - ${sound.artist}`;
                soundDropdown.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching sounds:', error);
        });

    soundDropdown.addEventListener('change', function() {
        const selectedSound = soundDropdown.value;
        if (selectedSound) {
            previewContainer.style.display = 'block';
            previewButton.onclick = function() {
                const soundPath = `../sounds/${selectedSound}`;
                console.log('Playing sound from:', soundPath);
                audioPlayer.src = soundPath;
                audioPlayer.play();

                // Stop the audio after 9 seconds
                setTimeout(() => {
                    audioPlayer.pause();
                    audioPlayer.currentTime = 0;
                }, 9000);
            };
        } else {
            previewContainer.style.display = 'none';
        }
    });

    soundSelectionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectedSound = soundDropdown.value;
    
        if (!selectedSound || !username) {
            alert('Please select a sound and make sure you are logged in.');
            return;
        }
    
        fetch('http://localhost:3000/saveWinningSound', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'username': username,
                'quizcode': quizCode
            },
            body: JSON.stringify({ winningSound: selectedSound })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Winning sound saved successfully!') {
                alert('Winning sound saved successfully!');
                nextButton.style.display = 'block';
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error saving winning sound:', error);
            alert('Error: ' + error.message);
        });
    });
});

function redirectToWaitingRoom() {
    const quizCode = sessionStorage.getItem('quizCode');
    if (!quizCode) {
        alert('Quiz code is missing. Please try again.');
        return;
    }
    window.location.href = `waitingRoom.html?quizCode=${quizCode}`;
}