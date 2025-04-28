const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;


app.use(cors({
    origin: '*', // Allow requests from any origin
    methods: ['GET', 'POST'], // Allow these HTTP methods
    allowedHeaders: ['Content-Type', 'username', 'quizcode'] // Allow these headers
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..'))); 
 
 // Serve sounds directory
 app.use('/sounds', express.static(path.join(__dirname, '../../sounds')));
 
 // Redirect root to login page
 app.get('/', (req, res) => {
     // Redirect to the login.html file in the parent directory
     res.redirect('/login.html');
 });

let quizSessions = {};
let clients = {}; // Store WebSocket clients

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req) => {
    const username = req.url.split('?username=')[1];
    console.log(`WebSocket connection established for username: ${username}`);
    clients[username] = ws;

    ws.on('close', () => {
        console.log(`WebSocket connection closed for username: ${username}`);
        delete clients[username];
    });
});

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Endpoint to get the list of question sets
app.get('/questionSets', (req, res) => {
    const questionsDir = path.join(__dirname, '../../questions');
    fs.readdir(questionsDir, (err, files) => {
        if (err) {
            console.error('Error reading question sets directory:', err);
            return res.status(500).json({ message: 'Error reading question sets directory' });
        }
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        res.status(200).json(jsonFiles);
    });
});

// Endpoint to get the list of sounds
app.get('/sounds', (req, res) => {
    const soundsFilePath = path.join(__dirname, '../../sounds/sounds.json');
    fs.readFile(soundsFilePath, (err, data) => {
        if (err) {
            console.error('Error reading sounds file:', err);
            return res.status(500).json({ message: 'Error reading sounds file' });
        }
        const sounds = JSON.parse(data);
        res.status(200).json(sounds);
    });
});

// Endpoint to create a quiz session
app.post('/createQuiz', (req, res) => {
    const { quizTitle, quizDescription, questionSet, quizCode, hostUsername, soundPlayback } = req.body;

    if (!quizTitle || !quizDescription || !questionSet || !quizCode || !hostUsername || !soundPlayback) {
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    const questionSetPath = path.join(__dirname, '../../questions', questionSet);
    if (!fs.existsSync(questionSetPath)) {
        return res.status(404).json({ message: 'Question set not found.' });
    }

    const questions = JSON.parse(fs.readFileSync(questionSetPath));
    const shuffledQuestions = shuffleArray(questions);

    quizSessions[quizCode] = {
        quizTitle,
        quizDescription,
        questionSet,
        questions: shuffledQuestions,
        participants: [],
        currentQuestionIndex: 0,
        hostUsername,
        soundPlayback
    };

    res.status(200).json({ message: 'Quiz created successfully!', quizCode });
});

// Endpoint to join a quiz session
app.post('/joinQuiz', (req, res) => {
    const { quizCode, username } = req.body;

    if (!quizCode || !username) {
        return res.status(400).json({ message: 'Please provide a quiz code and username.' });
    }

    if (!quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    // Check if the participant already exists
    const participantExists = quizSessions[quizCode].participants.some(participant => participant.username === username);
    if (participantExists) {
        return res.status(400).json({ message: 'Participant already joined.' });
    }

    // Add the participant with username and an empty teamName
    quizSessions[quizCode].participants.push({ username, teamName: '' });
    res.status(200).json({ message: 'Joined quiz successfully!' });
});

app.get('/getParticipants', (req, res) => {
    const quizCode = req.query.quizCode;

    if (!quizCode || !quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    res.status(200).json({ participants: quizSessions[quizCode].participants });
});

app.post('/register', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        console.error('Please fill in all fields.');
        return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    const usersFilePath = path.join(__dirname, 'users.json');
    let users = [];

    if (fs.existsSync(usersFilePath)) {
        const usersData = fs.readFileSync(usersFilePath);
        users = JSON.parse(usersData);
    }

    if (users.find(user => user.username === username)) {
        console.error('Username already exists. Please choose a different username.');
        return res.status(400).json({ message: 'Username already exists. Please choose a different username.' });
    }

    users.push({ username, password, role });
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

    console.log('Registration successful!');
    res.status(200).json({ message: 'Registration successful! Please log in.' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        console.error('Please fill in both fields.');
        return res.status(400).json({ message: 'Please fill in both fields.' });
    }

    const usersFilePath = path.join(__dirname, 'users.json');
    if (!fs.existsSync(usersFilePath)) {
        console.error('Invalid username or password');
        return res.status(400).json({ message: 'Invalid username or password' });
    }

    const usersData = fs.readFileSync(usersFilePath);
    const users = JSON.parse(usersData);

    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        console.log('Login successful!');
        return res.status(200).json({ message: 'Login successful!' });
    } else {
        console.error('Invalid username or password');
        return res.status(400).json({ message: 'Invalid username or password' });
    }
});

app.post('/getUserRole', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    const usersFilePath = path.join(__dirname, 'users.json');
    let users = [];

    if (fs.existsSync(usersFilePath)) {
        const usersData = fs.readFileSync(usersFilePath);
        users = JSON.parse(usersData);
    }

    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ role: user.role });
});

app.post('/saveTeamName', (req, res) => {
    const { teamName } = req.body;
    const username = req.headers['username'];
    const quizCode = req.headers['quizcode'];

    console.log('Received request to save team name:', { teamName, username, quizCode });

    if (!teamName || !username || !quizCode) {
        console.error('Missing required fields:', { teamName, username, quizCode });
        return res.status(400).json({ message: 'Please provide team name, username, and quiz code.' });
    }

    if (quizSessions[quizCode]) {
        quizSessions[quizCode].participants = quizSessions[quizCode].participants.map(participant => {
            if (participant.username === username) {
                return { ...participant, teamName };
            }
            return participant;
        });
        console.log('Team name saved successfully for user:', username);
        res.status(200).json({ message: 'Team name saved successfully!' });
    } else {
        console.error('Quiz not found for code:', quizCode);
        res.status(404).json({ message: 'Quiz not found.' });
    }
});

app.post('/saveWinningSound', (req, res) => {
    const { winningSound } = req.body;
    const username = req.headers['username'];
    const quizCode = req.headers['quizcode'];

    console.log('Received request to save winning sound:', { winningSound, username, quizCode });

    if (!winningSound || !username || !quizCode) {
        console.error('Missing required fields:', { winningSound, username, quizCode });
        return res.status(400).json({ message: 'Please provide winning sound, username, and quiz code.' });
    }

    if (quizSessions[quizCode]) {
        quizSessions[quizCode].participants = quizSessions[quizCode].participants.map(participant => {
            if (participant.username === username) {
                return { ...participant, winningSound };
            }
            return participant;
        });
        console.log('Winning sound saved successfully for user:', username);
        res.status(200).json({ message: 'Winning sound saved successfully!' });
    } else {
        console.error('Quiz not found for code:', quizCode);
        res.status(404).json({ message: 'Quiz not found.' });
    }
});

app.post('/removeParticipant', (req, res) => {
    const { quizCode, username } = req.body;

    if (!quizCode || !username) {
        return res.status(400).json({ message: 'Please provide a quiz code and username.' });
    }

    if (!quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    quizSessions[quizCode].participants = quizSessions[quizCode].participants.filter(participant => participant.username !== username);

    // Notify the client that they have been removed
    if (clients[username]) {
        clients[username].send(JSON.stringify({ message: 'You have been removed from the quiz.' }));
    }

    res.status(200).json({ message: 'Participant removed successfully!' });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

app.post('/startQuiz', (req, res) => {
    const { quizCode } = req.body;

    if (!quizCode || !quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    quizSessions[quizCode].participants.forEach(participant => {
        if (clients[participant.username]) {
            clients[participant.username].send(JSON.stringify({ message: 'The quiz has started!' }));
        }
    });

    res.status(200).json({ message: 'Quiz has successfully started!' });
});

app.get('/getNextQuestion', (req, res) => {
    const quizCode = req.query.quizCode;

    if (!quizCode || !quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizSession = quizSessions[quizCode];
    const currentQuestionIndex = quizSession.currentQuestionIndex;

    if (currentQuestionIndex >= quizSession.questions.length) {
        return res.status(200).json({ message: 'No more questions.' });
    }

    const question = quizSession.questions[currentQuestionIndex];
    quizSession.currentQuestionIndex += 1;

    // Reset answeredPlayers as an OBJECT (not a Set) and start tracking time
    quizSession.answeredPlayers = {};
    quizSession.firstAnswer = null;
    quizSession.questionStartTime = Date.now();

    // Broadcast the current question to all participants
    quizSession.participants.forEach(participant => {
        if (clients[participant.username]) {
            clients[participant.username].send(JSON.stringify({ question: question.question, options: question.options }));
        }
    });

    res.status(200).json({ question: question.question, options: question.options });
});

app.get('/getCurrentQuestion', (req, res) => {
    const quizCode = req.query.quizCode;

    if (!quizCode || !quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizSession = quizSessions[quizCode];
    const currentQuestionIndex = quizSession.currentQuestionIndex;

    if (currentQuestionIndex >= quizSession.questions.length) {
        return res.status(200).json({ message: 'No more questions.' });
    }

    const question = quizSession.questions[currentQuestionIndex];

    res.status(200).json({ question: question.question, options: question.options });
});

app.post('/advanceQuestion', (req, res) => {
    const { quizCode } = req.body;

    if (!quizCode || !quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizSession = quizSessions[quizCode];
    const currentQuestionIndex = quizSession.currentQuestionIndex;

    if (currentQuestionIndex >= quizSession.questions.length) {
        return res.status(200).json({ message: 'No more questions.' });
    }

    const question = quizSession.questions[currentQuestionIndex];
    quizSession.currentQuestionIndex += 1;

    // Clear the answeredPlayers as an OBJECT (not a Set) and reset firstAnswer
    quizSession.answeredPlayers = {};
    quizSession.firstAnswer = null;
    quizSession.questionStartTime = Date.now();

    // Broadcast the current question to all participants
    quizSession.participants.forEach(participant => {
        if (clients[participant.username]) {
            clients[participant.username].send(JSON.stringify({ 
                question: question.question, 
                options: question.options,
                hideLeaderboard: true
            }));
        }
    });

    res.status(200).json({ question: question.question, options: question.options });
});

app.post('/endQuestion', (req, res) => {
    const { quizCode } = req.body;

    if (!quizCode || !quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizSession = quizSessions[quizCode];
    const currentQuestionIndex = quizSession.currentQuestionIndex - 1;

    if (currentQuestionIndex < 0 || currentQuestionIndex >= quizSession.questions.length) {
        return res.status(400).json({ message: 'Invalid question index.' });
    }

    const question = quizSession.questions[currentQuestionIndex];
    const correctAnswer = question.correctAnswer;

    if (!correctAnswer) {
        return res.status(500).json({ message: 'Correct answer not found for the current question.' });
    }

    console.log("Answer tracking debug:");
    console.log("answeredPlayers:", quizSession.answeredPlayers);
    console.log("Participants:", quizSession.participants.map(p => p.username));

    // Check if any players have answered
    const answeredUsernames = Object.keys(quizSession.answeredPlayers || {});
    
    if (answeredUsernames.length === 0) {
        console.log('No players have answered the question.');
        return res.status(200).json({ message: 'No players have answered the question.', correctAnswer });
    }

    // Find players who answered correctly
    const correctPlayers = answeredUsernames.filter(username => 
        quizSession.answeredPlayers[username] === correctAnswer
    );

    // If no one answered correctly, just show the correct answer
    if (correctPlayers.length === 0) {
        console.log('No player answered correctly. Correct answer:', correctAnswer);
        
        quizSession.participants.forEach(participant => {
            if (clients[participant.username]) {
                clients[participant.username].send(JSON.stringify({ correctAnswer }));
            }
        });
        
        return res.status(200).json({ message: 'No player answered correctly.', correctAnswer });
    }

    // The first player who answered correctly should be the winner
    const firstCorrectUsername = quizSession.firstAnswer || correctPlayers[0];
    const winningPlayer = quizSession.participants.find(participant => participant.username === firstCorrectUsername);

    if (!winningPlayer) {
        console.log(`Winning player ${firstCorrectUsername} not found in participants list.`);
        return res.status(200).json({ message: 'Winner is no longer in the quiz.', correctAnswer });
    }

    const { teamName, winningSound } = winningPlayer;
    const soundPlayback = quizSession.soundPlayback || 'host'; // Default to host if not set
    const hostUsername = quizSession.hostUsername;
    
    // Get the winner's answer time
    const answerTime = quizSession.answerTimes[firstCorrectUsername];
    
    console.log(`Broadcasting correct answer: ${correctAnswer}, teamName: ${teamName}, winningSound: ${winningSound}, soundPlayback: ${soundPlayback}, answerTime: ${answerTime}`);
    
    // Get the leaderboard data
    const leaderboard = quizSession.leaderboard || {};
    
    // Broadcast the correct answer, team name, winning sound, playback option, answer time, and leaderboard to all participants
    quizSession.participants.forEach(participant => {
        if (clients[participant.username]) {
            clients[participant.username].send(JSON.stringify({ 
                correctAnswer, 
                teamName, 
                winningSound, 
                soundPlayback,
                answerTime,
                leaderboard,
                showLeaderboard: true
            }));
        }
    });
    
    // Send the winning sound to the host if playback is set to "host"
    if (soundPlayback === 'host' && clients[hostUsername]) {
        clients[hostUsername].send(JSON.stringify({ 
            correctAnswer, 
            teamName, 
            winningSound, 
            soundPlayback,
            answerTime,
            leaderboard
        }));
    }

    // Reset the firstAnswer for the next question
    quizSession.firstAnswer = null;

    res.status(200).json({ message: 'Question ended successfully.', correctAnswer });
});

app.post('/submitAnswer', (req, res) => {
    const { quizCode, username, answer } = req.body;

    if (!quizCode || !username || !answer) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizSession = quizSessions[quizCode];

    // Initialize answeredPlayers and leaderboard if not already present
    if (!quizSession.answeredPlayers) {
        quizSession.answeredPlayers = {};
    }
    if (!quizSession.leaderboard) {
        quizSession.leaderboard = {};
    }
    if (!quizSession.answerTimes) {
        quizSession.answerTimes = {};
    }

    // Check if the player has already answered
    if (quizSession.answeredPlayers[username]) {
        return res.status(400).json({ message: 'Player has already answered this question.' });
    }

    // Calculate the time taken to answer
    const timeTaken = Date.now() - quizSession.questionStartTime;
    
    // Store the player's answer and answer time
    quizSession.answeredPlayers[username] = answer;
    quizSession.answerTimes[username] = timeTaken;

    // Calculate points if the answer is correct
    const correctAnswer = quizSession.questions[quizSession.currentQuestionIndex - 1]?.correctAnswer;
    const isCorrect = answer === correctAnswer;

    if (isCorrect) {
        // Initialize points-related structures if not present
        if (!quizSession.pointsForQuestion) {
            quizSession.pointsForQuestion = {};
        }
        if (!quizSession.leaderboard) {
            quizSession.leaderboard = {};
        }
        
        // More sophisticated points calculation
        let points = 0;
        
        // Calculate base points faster answers get more points
        // Maximum points for answering in less than 1 second: 1000
        // Minimum points after 20 seconds: 200
        const maxPoints = 1000;
        const minPoints = 200;
        const maxTimeForPoints = 20000; // 20 seconds
        
        if (timeTaken < 1000) {
            // Instant answers (under 1 second) get maximum points
            points = maxPoints;
        } else if (timeTaken > maxTimeForPoints) {
            // Very slow answers (over 20 seconds) get minimum points
            points = minPoints;
        } else {
            const timeRange = maxTimeForPoints - 1000;
            const pointsRange = maxPoints - minPoints;
            const reduction = Math.floor((timeTaken - 1000) / timeRange * pointsRange);
            points = maxPoints - reduction;
        }
        
        // Bonus for being first to answer correctly
        if (!quizSession.firstAnswer) {
            quizSession.firstAnswer = username;
            points += 500; // Bonus for being first
            console.log(`First correct answer by: ${username} - awarded 500 bonus points`);
        }
        
        // Store the points for this question
        quizSession.pointsForQuestion[username] = points;
        
        // Initialize player's total points if not already in leaderboard
        if (!quizSession.leaderboard[username]) {
            quizSession.leaderboard[username] = 0;
        }
        
        // Add points to the player's score
        quizSession.leaderboard[username] += points;
        
        console.log(`Player ${username} answered correctly in ${timeTaken}ms and earned ${points} points.`);
    } else {
        // For incorrect answers
        if (!quizSession.pointsForQuestion) {
            quizSession.pointsForQuestion = {};
        }
        quizSession.pointsForQuestion[username] = 0;
        
        // Initialize player's total points if not already in leaderboard
        if (!quizSession.leaderboard[username]) {
            quizSession.leaderboard[username] = 0;
        }
        
        console.log(`Player ${username} answered incorrectly: "${answer}" (correct was "${correctAnswer}").`);
    }

    // Notify the host about the updated count and leaderboard
    const totalPlayers = quizSession.participants.length;
    const answeredCount = Object.keys(quizSession.answeredPlayers).length;

    console.log(`Sending answeredCount: ${answeredCount}/${totalPlayers} to host.`);

    const hostUsername = quizSession.hostUsername;
    if (clients[hostUsername]) {
        // Enhanced data to send to the host
        clients[hostUsername].send(JSON.stringify({ 
            answeredCount, 
            totalPlayers,
            leaderboard: quizSession.leaderboard,
            latestAnswer: {
                username,
                teamName: quizSession.participants.find(p => p.username === username)?.teamName || username,
                isCorrect,
                timeTaken,
                points: quizSession.pointsForQuestion[username] || 0
            }
        }));
    }

    res.status(200).json({ message: 'Answer submitted successfully.' });
});

app.get('/getLeaderboard', (req, res) => {
    const quizCode = req.query.quizCode;

    if (!quizCode || !quizSessions[quizCode]) {
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizSession = quizSessions[quizCode];
    const leaderboard = quizSession.leaderboard || {};

    res.status(200).json({ leaderboard });
});

app.post('/endQuiz', (req, res) => {
    const { quizCode } = req.body;
    
    console.log('Received request to end quiz with code:', quizCode);
    console.log('Available quiz sessions:', Object.keys(quizSessions));

    if (!quizCode || !quizSessions[quizCode]) {
        console.error('Quiz not found for code:', quizCode);
        return res.status(404).json({ message: 'Quiz not found.' });
    }

    const quizSession = quizSessions[quizCode];
    const leaderboard = quizSession.leaderboard || {};
    
    // Find the winner (player with highest score)
    let winnerUsername = null;
    let highestScore = -1;
    
    Object.entries(leaderboard).forEach(([username, points]) => {
        if (points > highestScore) {
            highestScore = points;
            winnerUsername = username;
        }
    });
    
    if (!winnerUsername) {
        return res.status(200).json({ message: 'No participants found or no scores recorded.' });
    }
    
    // Get the winner's team name
    const winner = quizSession.participants.find(p => p.username === winnerUsername);
    
    if (!winner) {
        return res.status(200).json({ message: 'Winner not found in participants list.' });
    }
    
    const winnerData = {
        username: winnerUsername,
        teamName: winner.teamName || winnerUsername,
        points: leaderboard[winnerUsername],
        winningSound: winner.winningSound || 'victory.mp3'
    };
    
    // Broadcast the winner to all participants
    quizSession.participants.forEach(participant => {
        if (clients[participant.username]) {
            clients[participant.username].send(JSON.stringify({
                quizEnded: true,
                winner: winnerData,
                leaderboard
            }));
        }
    });
    
    // Also inform the host
    if (clients[quizSession.hostUsername]) {
        clients[quizSession.hostUsername].send(JSON.stringify({
            quizEnded: true,
            winner: winnerData,
            leaderboard
        }));
    }
    
    res.status(200).json({ 
        message: 'Quiz ended successfully.',
        winner: winnerData
    });
});