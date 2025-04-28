document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    if (container) {
        container.style.maxWidth = '1200px';
        container.style.width = '90%';
        container.style.margin = '40px auto';
        container.style.padding = '50px';
    }
    
    // Make the quiz code larger and more prominent
    const quizCodeEl = document.getElementById('quizCode');
    if (quizCodeEl) {
        quizCodeEl.parentElement.style.fontSize = '1.8rem';
        quizCodeEl.style.fontSize = '2rem';
        quizCodeEl.style.fontWeight = 'bold';
        quizCodeEl.style.color = '#1890ff';
    }
    
    // Make the question and options larger
    const questionEl = document.getElementById('question');
    if (questionEl) {
        questionEl.style.fontSize = '2.2rem';
        questionEl.style.margin = '30px 0';
        questionEl.style.lineHeight = '1.4';
    }
    
    // Make option buttons larger
    const optionsContainer = document.getElementById('options');
    if (optionsContainer) {
        optionsContainer.style.display = 'grid';
        optionsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        optionsContainer.style.gap = '20px';
        optionsContainer.style.width = '100%';
        optionsContainer.style.maxWidth = '1000px';
        optionsContainer.style.margin = '30px auto';
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const quizCode = urlParams.get('quizCode');

    if (!quizCode) {
        alert('Quiz code is missing. Redirecting to the main page.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('quizCode').textContent = quizCode;

    sessionStorage.setItem('quizCode', quizCode);

    const questionContainer = document.getElementById('questionContainer');
    const questionElement = document.getElementById('question');

    // WebSocket connection
    const username = sessionStorage.getItem('username');
    const ws = new WebSocket(`ws://localhost:3000?username=${username}`);

    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if (message.quizEnded) {
            const container = document.querySelector('.container');
            const winnerData = message.winner;
            Array.from(container.children).forEach(child => {
                child.style.display = 'none';
            });
            showFinalWinner(winnerData, container);
        
            if (message.winner.username === currentUsername) {
                const audio = new Audio(`../sounds/${message.winner.winningSound || 'victory.mp3'}`);
                audio.play().catch(error => {
                    console.error('Error playing audio:', error);
                });
            }
        }
    
        if (message.question) {
            // Hide the leaderboard if it's visible
            if (document.getElementById('playerLeaderboard')) {
                document.getElementById('playerLeaderboard').remove();
            }
            
            // Also remove any celebration elements if they exist
            if (document.getElementById('celebrationContainer')) {
                document.getElementById('celebrationContainer').remove();
            }
    
            questionElement.textContent = message.question;
            optionsContainer.innerHTML = '';
            message.options.forEach(option => {
                const optionElement = document.createElement('button');
                optionElement.textContent = option;
                optionElement.className = 'button join-button';
                optionElement.addEventListener('click', function() {
                    submitAnswer(option, optionElement);
                });
                optionsContainer.appendChild(optionElement);
            });
            questionContainer.style.display = 'block';
        } else if (message.correctAnswer) {
            console.log(`Received correct answer: ${message.correctAnswer}`);
    
            // Highlight the correct and incorrect answers
            const buttons = optionsContainer.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.textContent === message.correctAnswer) {
                    button.style.backgroundColor = '#4CAF50';
                    button.style.color = 'white';
                } else if (button.style.backgroundColor === 'rgb(0, 55, 200)') {
                    button.style.backgroundColor = '#FF0000';
                    button.style.color = 'white';
                } else {
                    button.style.backgroundColor = '#ccc';
                    button.style.color = '#666';
                }
                button.disabled = true; // Disable all buttons
            });
    
            // Create celebration screen
            if (message.teamName) {
                const container = document.querySelector('.container');
                const children = Array.from(container.children);
                children.forEach(child => {
                    if (!child.id || (child.id !== 'celebrationContainer' && child.id !== 'playerLeaderboard')) {
                        child.style.display = 'none';
                    }
                });
                const celebrationContainer = document.createElement('div');
                celebrationContainer.id = 'celebrationContainer';
                celebrationContainer.style.position = 'fixed';
                celebrationContainer.style.top = '0';
                celebrationContainer.style.left = '0';
                celebrationContainer.style.width = '100%';
                celebrationContainer.style.height = '100%';
                celebrationContainer.style.backgroundColor = 'transparent'; 
                celebrationContainer.style.display = 'flex';
                celebrationContainer.style.flexDirection = 'column';
                celebrationContainer.style.justifyContent = 'center';
                celebrationContainer.style.alignItems = 'center';
                celebrationContainer.style.zIndex = '1000';
                celebrationContainer.style.overflow = 'hidden';
                const styleElement = document.createElement('style');
                styleElement.textContent = `
                    @keyframes confetti-fall {
                        0% { transform: translateY(-100vh) rotate(0deg); }
                        100% { transform: translateY(100vh) rotate(360deg); }
                    }
                    
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                    
                    @keyframes rainbow {
                        0% { color: red; }
                        14% { color: orange; }
                        28% { color: yellow; }
                        42% { color: green; }
                        57% { color: blue; }
                        71% { color: indigo; }
                        85% { color: violet; }
                        100% { color: red; }
                    }
                    
                    @keyframes spotlight {
                        0% { background-position: -100% 0; }
                        100% { background-position: 200% 0; }
                    }
                    
                    @keyframes backgroundShift {
                        0% { background-color: #ff0000; }  /* Red */
                        16.6% { background-color: #ff00ff; }  /* Pink */
                        33.3% { background-color: #0000ff; }  /* Blue */
                        50% { background-color: #00ffff; }    /* Cyan */
                        66.6% { background-color: #00ff00; }  /* Green */
                        83.3% { background-color: #ffff00; }  /* Yellow */
                        100% { background-color: #ff0000; }   /* Back to Red */
                    }
                    
                    .confetti {
                        position: absolute;
                        width: 10px;
                        height: 20px;
                        animation: confetti-fall linear forwards;
                    }
                    
                    .rgb-background {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        animation: backgroundShift 10s infinite linear;
                        opacity: 0.8;
                        z-index: -1;
                    }
                `;
                document.head.appendChild(styleElement);
            
                // Create RGB background
                const rgbBackground = document.createElement('div');
                rgbBackground.className = 'rgb-background';
                celebrationContainer.appendChild(rgbBackground);
                const overlay = document.createElement('div');
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                overlay.style.zIndex = '0';
                celebrationContainer.appendChild(overlay);
            
                // Create and add confetti pieces
                for (let i = 0; i < 100; i++) {
                    setTimeout(() => {
                        const confetti = document.createElement('div');
                        confetti.className = 'confetti';
                        confetti.style.left = Math.random() * 100 + 'vw';
                        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
                        confetti.style.borderRadius = '50%';
                        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
                        confetti.style.opacity = Math.random() * 0.7 + 0.3;
                        confetti.style.zIndex = '2'; // Make sure confetti is above the background
                        celebrationContainer.appendChild(confetti);
                        
                        // Remove confetti after animation ends
                        setTimeout(() => {
                            confetti.remove();
                        }, 5000);
                    }, i * 50);
                }
                
                // Create spotlight effect
                const spotlight = document.createElement('div');
                spotlight.style.position = 'absolute';
                spotlight.style.width = '100%';
                spotlight.style.height = '100%';
                spotlight.style.top = '0';
                spotlight.style.left = '0';
                spotlight.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)';
                spotlight.style.backgroundSize = '200% 100%';
                spotlight.style.animation = 'spotlight 2s infinite linear';
                spotlight.style.zIndex = '1'; // Between background and content
                celebrationContainer.appendChild(spotlight);
            
                // Create winner announcement
                const winnerContainer = document.createElement('div');
                winnerContainer.style.textAlign = 'center';
                winnerContainer.style.zIndex = '3'; // Above everything
                winnerContainer.style.position = 'relative';
                
                // "Winner!" text
                const winnerText = document.createElement('div');
                winnerText.textContent = 'QUICKEST!';
                winnerText.style.fontSize = '4rem';
                winnerText.style.fontWeight = 'bold';
                winnerText.style.marginBottom = '20px';
                winnerText.style.textShadow = '0 0 10px black, 0 0 20px black, 0 0 30px black'; // Darker shadow for better contrast
                winnerText.style.animation = 'pulse 1s infinite, rainbow 3s infinite';
                winnerContainer.appendChild(winnerText);
                
                // Team name display
                const teamNameElement = document.createElement('div');
                teamNameElement.textContent = message.teamName;
                teamNameElement.style.fontSize = '6rem';
                teamNameElement.style.fontWeight = 'bold';
                teamNameElement.style.marginBottom = '40px';
                teamNameElement.style.color = 'white';
                teamNameElement.style.textShadow = '0 0 10px black, 0 0 20px black, 0 0 30px black'; // Darker shadow for better contrast
                teamNameElement.style.animation = 'pulse 0.5s infinite';
                winnerContainer.appendChild(teamNameElement);
                
                // Correct answer display
                const correctAnswerElement = document.createElement('div');
                correctAnswerElement.textContent = `Correct Answer: ${message.correctAnswer}`;
                correctAnswerElement.style.fontSize = '2rem';
                correctAnswerElement.style.color = '#4CAF50';
                correctAnswerElement.style.fontWeight = 'bold';
                correctAnswerElement.style.marginTop = '20px';
                correctAnswerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                correctAnswerElement.style.padding = '10px 20px';
                correctAnswerElement.style.borderRadius = '10px';
                correctAnswerElement.style.boxShadow = '0 0 20px #4CAF50';
                winnerContainer.appendChild(correctAnswerElement);
                
                // Add time taken display - new element
                if (message.answerTime !== undefined) {
                    const timeTakenElement = document.createElement('div');
                    const seconds = (message.answerTime / 1000).toFixed(2);
                    timeTakenElement.textContent = `Answered in ${seconds} seconds`;
                    timeTakenElement.style.fontSize = '1.5rem';
                    timeTakenElement.style.color = '#FFC107';
                    timeTakenElement.style.fontWeight = 'bold';
                    timeTakenElement.style.marginTop = '10px';
                    timeTakenElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                    timeTakenElement.style.padding = '8px 16px';
                    timeTakenElement.style.borderRadius = '10px';
                    timeTakenElement.style.boxShadow = '0 0 20px #FFC107';
                    winnerContainer.appendChild(timeTakenElement);
                }
                
                celebrationContainer.appendChild(winnerContainer);
                document.body.appendChild(celebrationContainer);
                
                // Create flashing border effect
                const flashInterval = setInterval(() => {
                    const borderColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
                    teamNameElement.style.textShadow = `0 0 10px ${borderColor}, 0 0 20px ${borderColor}, 0 0 30px ${borderColor}`;
                }, 100);
                
                // After 9 seconds (when sound finishes), show the leaderboard
                setTimeout(() => {
                    // Stop the flashing effect
                    clearInterval(flashInterval);
                    
                    // Remove the celebration container
                    if (document.getElementById('celebrationContainer')) {
                        document.body.removeChild(celebrationContainer);
                    }
                    
                    // Create and show the leaderboard
                    if (message.leaderboard && message.showLeaderboard) {
                        showLeaderboard(message.leaderboard, container);
                    }
                }, 9000);
            }
        } else if (message.hideLeaderboard) {
            // Hide the leaderboard when a new question starts
            if (document.getElementById('playerLeaderboard')) {
                document.getElementById('playerLeaderboard').remove();
            }
            
            // Also remove any celebration elements if they exist
            if (document.getElementById('celebrationContainer')) {
                document.getElementById('celebrationContainer').remove();
            }
            
            // Show all the regular elements
            const container = document.querySelector('.container');
            const children = Array.from(container.children);
            children.forEach(child => {
                child.style.display = ''; // Restore original display
            });
        }
    };
    
// Function to show the leaderboard with animations
function showLeaderboard(leaderboardData, container) {
    // Create leaderboard container
    const leaderboardContainer = document.createElement('div');
    leaderboardContainer.id = 'playerLeaderboard';
    leaderboardContainer.style.width = '90%';
    leaderboardContainer.style.margin = '20px auto';
    leaderboardContainer.style.padding = '30px';
    leaderboardContainer.style.backgroundColor = '#f9f9f9';
    leaderboardContainer.style.borderRadius = '15px';
    leaderboardContainer.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
    
    // Create leaderboard title
    const title = document.createElement('h2');
    title.textContent = 'Leaderboard';
    title.style.textAlign = 'center';
    title.style.marginBottom = '30px';
    title.style.color = '#333';
    title.style.fontSize = '2.5rem';
    leaderboardContainer.appendChild(title);
    
    // Create leaderboard list
    const list = document.createElement('ul');
    list.style.listStyleType = 'none';
    list.style.padding = '0';
    list.style.margin = '0 auto';
    list.style.maxWidth = '1000px';
    
    // Add CSS for animations
    const styleElement = document.createElement('style');
    styleElement.textContent = `
    @keyframes fadeInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes hitEffect {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes pointsGain {
        0% { opacity: 0; transform: translate(0, 0) scale(0.8); }
        20% { opacity: 1; transform: translate(10px, -10px) scale(1.2); }
        80% { opacity: 1; transform: translate(10px, -15px); }
        100% { opacity: 0; transform: translate(10px, -20px) scale(1); }
    }
    
    @keyframes overtakeAnimation {
        0% { background-color: inherit; transform: translateX(0); }
        20% { background-color: rgba(255, 215, 0, 0.3); transform: translateX(-10px); }
        40% { transform: translateX(10px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
        100% { background-color: inherit; transform: translateX(0); }
    }
    
    @keyframes swooshEffect {
        0% { opacity: 0; width: 0; }
        30% { opacity: 0.8; width: 100%; }
        100% { opacity: 0; width: 100%; }
    }
    
    .points-gain-container {
        position: absolute;
        right: -60px;
        top: 0;
        height: 100%;
        width: 80px;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        pointer-events: none;
        overflow: visible;
    }
    
    .points-gain {
        color: #4CAF50;
        font-weight: bold;
        animation: pointsGain 2s forwards;
        text-shadow: 0 0 5px rgba(0,0,0,0.5);
        white-space: nowrap;
        z-index: 100;
    }
    
    .overtake-indicator {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0;
        background: linear-gradient(to right, transparent, rgba(255, 215, 0, 0.5), transparent);
        z-index: 1;
        pointer-events: none;
        animation: swooshEffect 1.5s ease-in-out forwards;
    }
    
    .position-up {
        position: absolute;
        right: -40px;
        color: #4CAF50;
        font-weight: bold;
        opacity: 0;
        animation: pointsGain 2s forwards;
    }
`;
    document.head.appendChild(styleElement);
    
    // Convert leaderboard object to array and sort by points
    const sortedLeaderboard = Object.entries(leaderboardData)
        .sort((a, b) => b[1] - a[1]);
    
    // Get current user's username
    const currentUsername = sessionStorage.getItem('username');
    
    // Fetch the previous leaderboard data if available
    let previousLeaderboard = {};
    try {
        const savedLeaderboard = sessionStorage.getItem('previousLeaderboard');
        if (savedLeaderboard) {
            previousLeaderboard = JSON.parse(savedLeaderboard);
        }
    } catch (e) {
        console.error('Error parsing previous leaderboard:', e);
    }
    
    // Store current leaderboard for next time
    sessionStorage.setItem('previousLeaderboard', JSON.stringify(leaderboardData));
    
    // First, fetch participants to get team names
    fetch(`http://localhost:3000/getParticipants?quizCode=${quizCode}`)
        .then(response => response.json())
        .then(data => {
            const participants = data.participants;
            
            // Create leaderboard items with team names and animations
            sortedLeaderboard.forEach(([playerUsername, points], index) => {
                // Calculate points gained in this round
                const previousPoints = previousLeaderboard[playerUsername] || 0;
                const pointsGained = points - previousPoints;
                
                // Find the participant object to get the team name
                const participant = participants.find(p => p.username === playerUsername);
                const teamName = participant ? participant.teamName : playerUsername;
                
                const item = document.createElement('li');
                item.style.padding = '18px 25px';
                item.style.margin = '12px 0';
                item.style.borderRadius = '10px';
                item.style.backgroundColor = playerUsername === currentUsername ? '#e6f7ff' : 'white';
                item.style.border = playerUsername === currentUsername ? '3px solid #1890ff' : '1px solid #eee';
                item.style.fontWeight = playerUsername === currentUsername ? 'bold' : 'normal';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between'; 
                item.style.alignItems = 'center';
                item.style.position = 'relative';
                item.style.overflow = 'visible';
                item.style.animationDelay = `${index * 0.1}s`;
                item.style.animation = 'fadeInRight 0.5s ease forwards';
                item.style.opacity = '0';
                item.style.fontSize = '1.4rem';
                
                // Create left section for rank and team name
                const leftSection = document.createElement('div');
                leftSection.style.display = 'flex';
                leftSection.style.alignItems = 'center';
                leftSection.style.maxWidth = '70%';
                
                // Rank number
                const rank = document.createElement('span');
                rank.textContent = `${index + 1}.`;
                rank.style.marginRight = '15px';
                rank.style.fontWeight = 'bold';
                rank.style.minWidth = '35px';
                rank.style.flexShrink = '0';
                rank.style.fontSize = '1.6rem';
                
                // Team name display
                const teamNameElement = document.createElement('span');
                teamNameElement.textContent = teamName;
                teamNameElement.title = teamName;
                teamNameElement.style.overflow = 'hidden';
                teamNameElement.style.textOverflow = 'ellipsis';
                teamNameElement.style.whiteSpace = 'nowrap';
                teamNameElement.style.maxWidth = '300px';
                
                leftSection.appendChild(rank);
                leftSection.appendChild(teamNameElement);
                
                // Create right section for points with counter animation
                const pointsContainer = document.createElement('div');
                pointsContainer.style.flexShrink = '0';
                pointsContainer.style.minWidth = '120px';
                pointsContainer.style.textAlign = 'right';
                pointsContainer.style.position = 'relative';
                
                const pointsSpan = document.createElement('span');
                pointsSpan.textContent = previousPoints;
                pointsSpan.style.color = '#1890ff';
                pointsSpan.style.fontWeight = 'bold';
                pointsSpan.style.fontSize = '1.5rem';
                
                pointsContainer.appendChild(pointsSpan);
                
                // Add sections to the list item
                item.appendChild(leftSection);
                item.appendChild(pointsContainer);
                
                // Add points gain indicator if there are new points
                if (pointsGained > 0) {
                    // Create a container for the points gain element
                    const pointsGainContainer = document.createElement('div');
                    pointsGainContainer.className = 'points-gain-container';
                    
                    // Create the points gain element
                    const pointsGainElement = document.createElement('div');
                    pointsGainElement.className = 'points-gain';
                    pointsGainElement.textContent = `+${pointsGained}`;
                    pointsGainElement.style.fontSize = '1.5rem';
                    pointsGainElement.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                    pointsGainElement.style.padding = '5px 10px';
                    pointsGainElement.style.borderRadius = '15px';
                    
                    pointsGainContainer.appendChild(pointsGainElement);
                    
                    item.style.position = 'relative';
                    item.appendChild(pointsGainContainer);
                    
                    // Apply hit effect to the points total and animate counter
                    setTimeout(() => {
                        // Apply hit effect to the points total
                        pointsContainer.style.animation = 'hitEffect 0.5s ease';
                        
                        // Animate the points counter
                        const startValue = previousPoints;
                        const endValue = points;
                        const duration = 2000; // 2 seconds
                        const startTime = performance.now();
                        
                        function updateCounter(timestamp) {
                            const elapsed = timestamp - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            
                            // Use easeOutQuad for smoother animation
                            const easeProgress = 1 - (1 - progress) * (1 - progress);
                            
                            const currentValue = Math.floor(startValue + (endValue - startValue) * easeProgress);
                            pointsSpan.textContent = `${currentValue} pts`;
                            
                            if (progress < 1) {
                                requestAnimationFrame(updateCounter);
                            } else {
                                // Ensure we end with the exact final value
                                pointsSpan.textContent = `${endValue} pts`;
                                pointsContainer.style.animation = '';
                            }
                        }
                        
                        requestAnimationFrame(updateCounter);
                    }, 500 + index * 200);
                } else {
                    pointsSpan.textContent = `${points} pts`;
                }
                
                list.appendChild(item);
            });
            
            leaderboardContainer.appendChild(list);
            
            // Add waiting for next question text
            const waitingText = document.createElement('p');
            waitingText.textContent = 'Waiting for host to start next question...';
            waitingText.style.textAlign = 'center';
            waitingText.style.marginTop = '30px';
            waitingText.style.color = '#666';
            waitingText.style.fontStyle = 'italic';
            waitingText.style.animation = 'fadeInRight 0.5s ease forwards';
            waitingText.style.opacity = '0';
            waitingText.style.fontSize = '1.3rem';
            waitingText.style.animationDelay = `${sortedLeaderboard.length * 0.1 + 0.5}s`;
            leaderboardContainer.appendChild(waitingText);
            
            container.appendChild(leaderboardContainer);
        })
        .catch(error => {
            console.error('Error fetching participants:', error);
            
            // Simplified fallback implementation with larger elements
            sortedLeaderboard.forEach(([playerUsername, points], index) => {
                // Create simplified item with animations and larger sizes
                const item = document.createElement('li');
                item.style.padding = '18px 25px';
                item.style.margin = '12px 0';
                item.style.borderRadius = '10px';
                item.style.backgroundColor = playerUsername === currentUsername ? '#e6f7ff' : 'white';
                item.style.border = playerUsername === currentUsername ? '3px solid #1890ff' : '1px solid #eee';
                item.style.fontWeight = playerUsername === currentUsername ? 'bold' : 'normal';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.animation = 'fadeInRight 0.5s ease forwards';
                item.style.opacity = '0';
                item.style.animationDelay = `${index * 0.1}s`;
                item.style.fontSize = '1.4rem';
                
                const leftSection = document.createElement('div');
                leftSection.style.display = 'flex';
                leftSection.style.alignItems = 'center';
                
                const rank = document.createElement('span');
                rank.textContent = `${index + 1}.`;
                rank.style.marginRight = '15px';
                rank.style.fontWeight = 'bold';
                rank.style.fontSize = '1.6rem';
                
                const nameElement = document.createElement('span');
                nameElement.textContent = playerUsername;
                nameElement.style.overflow = 'hidden';
                nameElement.style.textOverflow = 'ellipsis';
                nameElement.style.whiteSpace = 'nowrap';
                nameElement.style.maxWidth = '300px';
                
                leftSection.appendChild(rank);
                leftSection.appendChild(nameElement);
                
                const pointsSpan = document.createElement('span');
                pointsSpan.textContent = `${points} pts`;
                pointsSpan.style.color = '#1890ff';
                pointsSpan.style.fontWeight = 'bold';
                pointsSpan.style.fontSize = '1.5rem';
                
                item.appendChild(leftSection);
                item.appendChild(pointsSpan);
                
                list.appendChild(item);
            });
            
            leaderboardContainer.appendChild(list);
            
            const waitingText = document.createElement('p');
            waitingText.textContent = 'Waiting for host to start next question...';
            waitingText.style.textAlign = 'center';
            waitingText.style.marginTop = '30px';
            waitingText.style.color = '#666';
            waitingText.style.fontStyle = 'italic';
            waitingText.style.animation = 'fadeInRight 0.5s ease forwards';
            waitingText.style.opacity = '0';
            waitingText.style.fontSize = '1.3rem';
            waitingText.style.animationDelay = `${sortedLeaderboard.length * 0.1 + 0.5}s`;
            leaderboardContainer.appendChild(waitingText);
            
            container.appendChild(leaderboardContainer);
        });
}

function getPositionChanges(previousLeaderboard, currentLeaderboard) {
    const previousRanking = Object.keys(previousLeaderboard).sort(
        (a, b) => previousLeaderboard[b] - previousLeaderboard[a]
    );
    const currentRanking = Object.keys(currentLeaderboard).sort(
        (a, b) => currentLeaderboard[b] - currentLeaderboard[a]
    );
    
    const changes = {};
    
    currentRanking.forEach((username, currentIndex) => {
        const previousIndex = previousRanking.indexOf(username);
        
        // If the user wasn't in the previous leaderboard, they're new
        if (previousIndex === -1) {
            changes[username] = { type: 'new', positions: 0 };
            return;
        }
        
        // Calculate position change (negative means moved up, positive means moved down)
        const positionChange = currentIndex - previousIndex;
        
        if (positionChange < 0) {
            // User moved up
            changes[username] = { 
                type: 'up', 
                positions: Math.abs(positionChange),
                overtakes: []
            };
            
            // Record who was overtaken
            for (let i = previousIndex - 1; i >= currentIndex; i--) {
                if (i >= 0 && i < previousRanking.length) {
                    changes[username].overtakes.push(previousRanking[i]);
                }
            }
        } else if (positionChange > 0) {
            // User moved down
            changes[username] = { type: 'down', positions: positionChange };
        } else {
            // No change
            changes[username] = { type: 'same', positions: 0 };
        }
    });
    
    return changes;
}

// Get position changes
const positionChanges = getPositionChanges(previousLeaderboard, leaderboardData);

// Create a mapping of usernames to their index in the sorted leaderboard
const usernameToIndex = {};
sortedLeaderboard.forEach(([username], index) => {
    usernameToIndex[username] = index;
});

    function submitAnswer(answer, selectedButton) {
        fetch('http://localhost:3000/submitAnswer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quizCode, username, answer })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Answer submitted successfully.') {
                // Highlight the selected answer and disable all buttons
                const buttons = optionsContainer.querySelectorAll('button');
                buttons.forEach(button => {
                    if (button === selectedButton) {
                        button.style.backgroundColor = '#0000FF';
                        button.style.color = 'white';
                    } else {
                        button.style.backgroundColor = '#ccc';
                        button.style.color = '#666';
                    }
                    button.disabled = true;
                });
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error submitting answer:', error);
        });
    }
});


function showFinalWinner(winnerData, container) {
    // Remove any existing content
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Create celebration container with fancy animations
    const celebrationContainer = document.createElement('div');
    celebrationContainer.id = 'finalWinnerContainer';
    celebrationContainer.style.width = '100%';
    celebrationContainer.style.height = '100%';
    celebrationContainer.style.display = 'flex';
    celebrationContainer.style.flexDirection = 'column';
    celebrationContainer.style.justifyContent = 'center';
    celebrationContainer.style.alignItems = 'center';
    celebrationContainer.style.position = 'relative';
    celebrationContainer.style.overflow = 'hidden';
    celebrationContainer.style.backgroundColor = '#1a1a1a';
    celebrationContainer.style.borderRadius = '15px';
    celebrationContainer.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    celebrationContainer.style.padding = '40px';
    
    // Add animation styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes trophy-shine {
            0% { background-position: -100% 0; }
            100% { background-position: 200% 0; }
        }
        
        @keyframes trophy-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        
        @keyframes firework {
            0% { transform: translate(var(--x), var(--initialY)); opacity: 1; width: 5px; height: 5px; }
            50% { opacity: 1; }
            100% { transform: translate(var(--x), var(--finalY)) scale(var(--scale)); opacity: 0; width: var(--size); height: var(--size); }
        }
        
        @keyframes title-glow {
            0%, 100% { text-shadow: 0 0 20px #ffcc00, 0 0 30px #ffcc00, 0 0 40px #ffcc00; }
            50% { text-shadow: 0 0 10px #ffcc00, 0 0 15px #ffcc00, 0 0 20px #ffcc00; }
        }
        
        @keyframes crown-rotate {
            0%, 100% { transform: rotate(-10deg); }
            50% { transform: rotate(10deg); }
        }
        
        @keyframes background-pulse {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .firework {
            position: absolute;
            border-radius: 50%;
            animation: firework 1.5s forwards;
            z-index: 2;
            pointer-events: none;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Create animated background
    const animatedBackground = document.createElement('div');
    animatedBackground.style.position = 'absolute';
    animatedBackground.style.top = '0';
    animatedBackground.style.left = '0';
    animatedBackground.style.width = '100%';
    animatedBackground.style.height = '100%';
    animatedBackground.style.background = 'linear-gradient(45deg, #ff9966, #ff5e62, #c62368, #8a2be2, #5170ff, #20bdff, #5effbc)';
    animatedBackground.style.backgroundSize = '400% 400%';
    animatedBackground.style.animation = 'background-pulse 15s ease infinite';
    animatedBackground.style.opacity = '0.4';
    animatedBackground.style.zIndex = '1';
    celebrationContainer.appendChild(animatedBackground);
    
    // Create a semi-transparent overlay for better text visibility
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.zIndex = '2';
    celebrationContainer.appendChild(overlay);
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.style.position = 'relative';
    contentContainer.style.zIndex = '3';
    contentContainer.style.textAlign = 'center';
    contentContainer.style.maxWidth = '800px';
    
    // Add trophy icon
    const trophyContainer = document.createElement('div');
    trophyContainer.style.marginBottom = '30px';
    
    const trophyIcon = document.createElement('div');
    trophyIcon.innerHTML = `
        <svg width="180" height="180" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16.5C9 16.5 6.5 14 6.5 11V4.5H17.5V11C17.5 14 15 16.5 12 16.5Z" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 4.5H17.5" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M17.5 4.5V7C17.5 8.35 18.65 9.5 20 9.5V9.5C20 9.5 18.5 9.5 18.5 11V13" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 4.5V7C6.5 8.35 5.35 9.5 4 9.5V9.5C4 9.5 5.5 9.5 5.5 11V13" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.5 16.5V18.5C9.5 19.605 10.395 20.5 11.5 20.5H12.5C13.605 20.5 14.5 19.605 14.5 18.5V16.5" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 20.5H15" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;
    trophyIcon.style.animation = 'trophy-bounce 3s ease-in-out infinite';
    trophyIcon.style.filter = 'drop-shadow(0 0 15px gold)';
    
    // Add crown above trophy
    const crownIcon = document.createElement('div');
    crownIcon.innerHTML = `
        <svg width="100" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10L6 5L12 8L18 5L21 10L19 18H5L3 10Z" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="gold"/>
            <path d="M5 18H19V21H5V18Z" stroke="gold" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="gold"/>
        </svg>
    `;
    crownIcon.style.animation = 'crown-rotate 2s ease-in-out infinite';
    crownIcon.style.filter = 'drop-shadow(0 0 10px gold)';
    crownIcon.style.marginBottom = '-15px';
    
    trophyContainer.appendChild(crownIcon);
    trophyContainer.appendChild(trophyIcon);
    contentContainer.appendChild(trophyContainer);
    
    // Add winner title
    const winnerTitle = document.createElement('h1');
    winnerTitle.textContent = '🏆 QUIZ CHAMPION 🏆';
    winnerTitle.style.fontSize = '3.5rem';
    winnerTitle.style.color = 'white';
    winnerTitle.style.marginBottom = '20px';
    winnerTitle.style.fontFamily = "'Arial Black', sans-serif";
    winnerTitle.style.textTransform = 'uppercase';
    winnerTitle.style.letterSpacing = '3px';
    winnerTitle.style.animation = 'title-glow 2s ease-in-out infinite';
    contentContainer.appendChild(winnerTitle);
    
    // Create shiny effect for winner name
    const winnerNameContainer = document.createElement('div');
    winnerNameContainer.style.position = 'relative';
    winnerNameContainer.style.display = 'inline-block';
    winnerNameContainer.style.marginBottom = '30px';
    winnerNameContainer.style.background = 'linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.8), transparent)';
    winnerNameContainer.style.backgroundSize = '200% 100%';
    winnerNameContainer.style.animation = 'trophy-shine 3s infinite linear';
    winnerNameContainer.style.padding = '15px 50px';
    winnerNameContainer.style.borderRadius = '10px';
    
    // Add winner team name
    const winnerName = document.createElement('h2');
    winnerName.textContent = winnerData.teamName;
    winnerName.style.fontSize = '4rem';
    winnerName.style.color = 'white';
    winnerName.style.margin = '0';
    winnerName.style.fontFamily = "'Arial Black', sans-serif";
    winnerName.style.textShadow = '0 0 20px gold';
    
    winnerNameContainer.appendChild(winnerName);
    contentContainer.appendChild(winnerNameContainer);
    
    // Add winner score
    const winnerScore = document.createElement('div');
    winnerScore.textContent = `Final Score: ${winnerData.points} points`;
    winnerScore.style.fontSize = '2.5rem';
    winnerScore.style.color = '#ffcc00';
    winnerScore.style.marginBottom = '30px';
    winnerScore.style.fontWeight = 'bold';
    winnerScore.style.textShadow = '0 0 10px rgba(255, 204, 0, 0.5)';
    contentContainer.appendChild(winnerScore);
    
    // Add "thanks for playing" message
    const thanksMessage = document.createElement('p');
    thanksMessage.textContent = 'Thanks for playing! 🎉';
    thanksMessage.style.fontSize = '1.8rem';
    thanksMessage.style.color = 'white';
    thanksMessage.style.marginTop = '20px';
    contentContainer.appendChild(thanksMessage);
    
    // Add fireworks effect
    function createFirework() {
        const firework = document.createElement('div');
        firework.className = 'firework';
        
        // Random position, size and color
        const x = (Math.random() * 100) - 50;
        const initialY = Math.random() * 50;
        const finalY = initialY - (Math.random() * 150 + 50);
        const size = Math.random() * 20 + 10;
        const scale = Math.random() * 3 + 1;
        const hue = Math.floor(Math.random() * 360);
        
        firework.style.setProperty('--x', `${x}px`);
        firework.style.setProperty('--initialY', `${initialY}px`);
        firework.style.setProperty('--finalY', `${finalY}px`);
        firework.style.setProperty('--size', `${size}px`);
        firework.style.setProperty('--scale', scale);
        firework.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        firework.style.left = '50%';
        firework.style.bottom = '0';
        
        celebrationContainer.appendChild(firework);
        
        // Remove after animation completes
        setTimeout(() => {
            firework.remove();
        }, 1500);
    }
    
    // Start fireworks
    const fireworkInterval = setInterval(createFirework, 200);
    
    // Clean up interval after 20 seconds
    setTimeout(() => {
        clearInterval(fireworkInterval);
    }, 20000);
    
    celebrationContainer.appendChild(contentContainer);
    container.appendChild(celebrationContainer);

    const homeButton = document.createElement('button');
    homeButton.textContent = 'Back to Home';
    homeButton.style.marginTop = '15px';
    homeButton.style.padding = '12px 25px';
    homeButton.style.fontSize = '1.2rem';
    homeButton.style.border = 'none';
    homeButton.style.borderRadius = '8px';
    homeButton.style.backgroundColor = '#4CAF50'; // Green color
    homeButton.style.color = 'white';
    homeButton.style.cursor = 'pointer';
    homeButton.style.fontWeight = 'bold';
    homeButton.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.5)';
    homeButton.style.transition = 'all 0.3s ease';
    homeButton.style.display = 'block';
    homeButton.style.margin = '15px auto 0';

    homeButton.addEventListener('mouseover', function() {
        homeButton.style.backgroundColor = '#3d8b40';
    });

    homeButton.addEventListener('mouseout', function() {
        homeButton.style.backgroundColor = '#4CAF50';
    });
    homeButton.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}