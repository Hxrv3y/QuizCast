document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quizCode');

    if (!quizCode) {
        alert('Quiz code is missing. Redirecting to the main page.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('quizCode').textContent = quizCode;

    sessionStorage.setItem('quizCode', quizCode);

    const participantsContainer = document.getElementById('participants');

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

    function updateParticipants() {
        fetch(`http://localhost:3000/getParticipants?quizCode=${quizCode}`)
            .then(response => response.json())
            .then(data => {
                participantsContainer.innerHTML = '';

                data.participants.forEach(participant => {
                    const participantElement = document.createElement('div');
                    participantElement.textContent = `${participant.teamName} (${participant.username})`;
                    participantsContainer.appendChild(participantElement);
                });
            })
            .catch(error => {
                console.error('Error fetching participants:', error);
            });
    }

    updateParticipants();
    setInterval(updateParticipants, 5000);
});