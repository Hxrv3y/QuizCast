document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quizCode');
    document.getElementById('quizCode').textContent = quizCode;

    const currentQuestionContainer = document.getElementById('currentQuestion');
    const nextQuestionButton = document.getElementById('nextQuestionButton');
    const endQuestionButton = document.getElementById('endQuestionButton');
    const answeredCountContainer = document.createElement('div');
    answeredCountContainer.id = 'answeredCount';
    answeredCountContainer.textContent = 'Answered: 0/0';
    currentQuestionContainer.parentNode.appendChild(answeredCountContainer);

    const correctAnswerContainer = document.createElement('div');
    correctAnswerContainer.id = 'correctAnswer';
    correctAnswerContainer.style.marginTop = '10px';
    correctAnswerContainer.style.fontWeight = 'bold';
    correctAnswerContainer.style.color = '#333';
    currentQuestionContainer.parentNode.appendChild(correctAnswerContainer);
    const leaderboardList = document.getElementById('leaderboard');

    const ws = new WebSocket(`ws://localhost:3000?username=${sessionStorage.getItem('username')}`);

    ws.onopen = function() {
        console.log('WebSocket connection established.');
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed.');
    };

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
    
        if (message.correctAnswer) {
            correctAnswerContainer.textContent = `Correct Answer: ${message.correctAnswer}`;
    
            if (message.teamName && message.winningSound) {
                console.log(`Playing sound: ${message.winningSound} for team: ${message.teamName}`);
    
                // Check the soundPlayback option and play the sound if it's set to "host"
                if (message.soundPlayback === 'host') {
                    const audio = new Audio(`../sounds/${message.winningSound}`);
                    audio.play().catch(error => {
                        console.error('Error playing audio:', error);
                    });
    
                    // Stop the sound after 9 seconds
                    setTimeout(() => {
                        audio.pause();
                        audio.currentTime = 0;
                    }, 9000);
                }
            }
    
            // Always show the "Next Question" button after getting the correct answer
            nextQuestionButton.style.display = 'block';
        } else if (message.answeredCount !== undefined && message.totalPlayers !== undefined) {
            // Update the "Answered: X/Y" text
            answeredCountContainer.textContent = `Answered: ${message.answeredCount}/${message.totalPlayers}`;
        }
        
        // Update the leaderboard when leaderboard data is received
        if (message.leaderboard) {
            updateLeaderboard(message.leaderboard);
        }
    };

    const endQuizButton = document.getElementById('endQuizButton');
    endQuizButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to end the quiz? This will declare the winner and finish the game.')) {
            fetch(`http://localhost:3000/endQuiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quizCode })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server responded with status ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.winner) {
                    alert(`Quiz ended. The winner is ${data.winner.teamName} with ${data.winner.points} points!`);
                    // Disable all control buttons
                    nextQuestionButton.disabled = true;
                    endQuestionButton.disabled = true;
                    endQuizButton.disabled = true;
                    
                    // Update the UI to show it's the end of the quiz
                    currentQuestionContainer.textContent = 'Quiz has ended. Winner announced!';
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error ending quiz:', error);
                alert('Error: ' + error.message);
            });
        }
    });
    
    // Function to update the leaderboard display
    function updateLeaderboard(leaderboardData) {
        // Clear the current leaderboard
        leaderboardList.innerHTML = '';
        
        // Convert leaderboard object to array and sort by points (descending)
        const sortedLeaderboard = Object.entries(leaderboardData)
            .sort((a, b) => b[1] - a[1]);
        
        // Create and append list items for each player
        sortedLeaderboard.forEach(([username, points], index) => {
            const listItem = document.createElement('li');
            
            // Find the team name for this username if available
            fetch(`http://localhost:3000/getParticipants?quizCode=${quizCode}`)
                .then(response => response.json())
                .then(data => {
                    const participant = data.participants.find(p => p.username === username);
                    const teamName = participant ? participant.teamName : username;
                    
                    // Format with rank, team name, username, and points
                    listItem.textContent = `${index + 1}. ${teamName} (${username}): ${points} points`;
                })
                .catch(error => {
                    // Fallback if we can't get the team name
                    listItem.textContent = `${index + 1}. ${username}: ${points} points`;
                });
            
            leaderboardList.appendChild(listItem);
        });
    }

    function fetchNextQuestion() {
        fetch(`http://localhost:3000/getNextQuestion?quizCode=${quizCode}`)
            .then(response => response.json())
            .then(data => {
                if (data.question) {
                    currentQuestionContainer.textContent = data.question;
                    answeredCountContainer.textContent = 'Answered: 0/0';
                    correctAnswerContainer.textContent = '';
                    nextQuestionButton.style.display = 'none';
                    endQuestionButton.style.display = 'block';
                } else {
                    currentQuestionContainer.textContent = 'No more questions.';
                    nextQuestionButton.disabled = true;
                    endQuestionButton.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching next question:', error);
            });
    }

    // Update in hostOverview.js
    nextQuestionButton.addEventListener('click', function() {
        // Hide the leaderboard immediately
        fetch(`http://localhost:3000/advanceQuestion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizCode })
        })
        .then(response => response.json())
        .then(data => {
            if (data.question) {
                currentQuestionContainer.textContent = data.question;
                answeredCountContainer.textContent = 'Answered: 0/0';
                correctAnswerContainer.textContent = '';
                nextQuestionButton.style.display = 'none';
                endQuestionButton.style.display = 'block';
            } else {
                currentQuestionContainer.textContent = 'No more questions.';
                nextQuestionButton.disabled = true;
                endQuestionButton.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error advancing question:', error);
        });
    });

    endQuestionButton.addEventListener('click', function() {
        // Hide the end question button immediately to prevent multiple clicks
        endQuestionButton.style.display = 'none';
        
        fetch('http://localhost:3000/endQuestion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizCode })
        })
        .then(response => response.json())
        .then(data => {
            correctAnswerContainer.textContent = `Correct Answer: ${data.correctAnswer}`;
            nextQuestionButton.style.display = 'block';
        })
        .catch(error => {
            console.error('Error ending question:', error);
            // If there was an error, show the End Question button again
            endQuestionButton.style.display = 'block';
        });
    });

    // Initialize the leaderboard on page load
    fetch(`http://localhost:3000/getLeaderboard?quizCode=${quizCode}`)
        .then(response => response.json())
        .then(data => {
            if (data.leaderboard) {
                updateLeaderboard(data.leaderboard);
            }
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
        });

    fetchNextQuestion();
});