document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quizCode');
    document.getElementById('quizCode').textContent = quizCode;

    const participantsContainer = document.getElementById('participants');
    const leaderboardContainer = document.getElementById('leaderboard');

    function updateParticipants() {
        fetch(`http://localhost:3000/getParticipants?quizCode=${quizCode}`)
            .then(response => response.json())
            .then(data => {
                participantsContainer.innerHTML = '';
                leaderboardContainer.innerHTML = '';

                data.participants.forEach(participant => {
                    const participantElement = document.createElement('div');
                    participantElement.textContent = `${participant.teamName} (${participant.username})`;
                    participantElement.style.cursor = 'pointer';
                    participantElement.addEventListener('click', function() {
                        if (confirm(`Are you sure you want to remove ${participant.teamName} (${participant.username})?`)) {
                            fetch('http://localhost:3000/removeParticipant', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ quizCode, username: participant.username })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.message === 'Participant removed successfully!') {
                                    alert('Participant removed successfully!');
                                    updateParticipants(); // Refresh the participants list
                                } else {
                                    alert('Error: ' + data.message);
                                }
                            })
                            .catch(error => {
                                console.error('Error removing participant:', error);
                                alert('Error: ' + error.message);
                            });
                        }
                    });
                    participantsContainer.appendChild(participantElement);

                    const leaderboardElement = document.createElement('div');
                    leaderboardElement.textContent = `${participant.teamName} (${participant.username})`;
                    leaderboardContainer.appendChild(leaderboardElement);
                });
            })
            .catch(error => {
                console.error('Error fetching participants:', error);
            });
    }

    updateParticipants();
    setInterval(updateParticipants, 5000);

    document.getElementById('startQuizButton').addEventListener('click', function() {
        fetch('http://localhost:3000/startQuiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizCode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Quiz has successfully started!') {
                alert('Quiz started');
                window.location.href = `hostOverview.html?quizCode=${quizCode}`;
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error starting quiz:', error);
            alert('Error: ' + error.message);
        });
    });
});