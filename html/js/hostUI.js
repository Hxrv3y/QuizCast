document.getElementById('createSessionForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const sessionName = document.getElementById('sessionName').value.trim();
    const activeSessionsList = document.getElementById('activeSessionsList');
    const existingSessions = Array.from(activeSessionsList.getElementsByTagName('li')).map(li => li.textContent);

    // Check for duplicate session names
    if (existingSessions.includes(sessionName)) {
        alert('Session name already exists. Please choose a different name.');
        return;
    }

    // Create a new session and add it to the active sessions list
    const listItem = document.createElement('li');
    listItem.textContent = sessionName;
    activeSessionsList.appendChild(listItem);
    document.getElementById('sessionName').value = '';

    // Redirect to the configure quiz page
    window.location.href = 'quizConfigure.html';
});