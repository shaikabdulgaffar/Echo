const micBtn = document.getElementById('mic-btn');
const chatWindow = document.querySelector('.chat-window'); // <-- changed from getElementById
const recordingStatus = document.getElementById('recording-status');
const statusElement = document.getElementById('status-text');
const clearChatBtn = document.getElementById('clear-chat');

let recognition;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
}

micBtn.onclick = () => {
    if (!recognition) {
        alert('Speech Recognition not supported in this browser.');
        return;
    }
    
    recognition.start();
    micBtn.classList.add('recording');
    recordingStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Listening...';
    statusElement.textContent = "Listening to your voice";
};

clearChatBtn.onclick = () => {
    chatWindow.innerHTML = '';
    statusElement.textContent = "Chat cleared - Ready to listen";
};

if (recognition) {
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        addBubble('user', transcript);
        micBtn.classList.remove('recording');
        recordingStatus.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processing...';
        statusElement.textContent = "Processing your request";
        sendVoice(transcript);
    };

    recognition.onerror = function() {
        micBtn.classList.remove('recording');
        recordingStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error. Try again.';
        statusElement.textContent = "Error occurred. Try again";
        setTimeout(() => {
            recordingStatus.innerHTML = '<i class="fas fa-hand-point-up"></i> Click to speak';
            statusElement.textContent = "Ready to listen";
        }, 2000);
    };

    recognition.onend = function() {
        micBtn.classList.remove('recording');
        if (recordingStatus.textContent.includes("Listening")) {
            recordingStatus.innerHTML = '<i class="fas fa-hand-point-up"></i> Click to speak';
            statusElement.textContent = "Ready to listen";
        }
    };
}

function addBubble(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${sender}`;

    const bubbleContent = document.createElement('div');
    bubbleContent.className = 'bubble-content';

    const messageSpan = document.createElement('span');
    messageSpan.textContent = text;

    if (sender === 'user') {
        // User icon on right
        bubbleContent.appendChild(messageSpan);
        const icon = document.createElement('i');
        icon.className = 'fas fa-user bubble-icon';
        bubbleContent.appendChild(icon);
    } else {
        // Chatbot icon on left
        const icon = document.createElement('i');
        icon.className = 'fas fa-robot bubble-icon';
        bubbleContent.appendChild(icon);
        bubbleContent.appendChild(messageSpan);
    }

    bubble.appendChild(bubbleContent);
    chatWindow.appendChild(bubble);
    
    // Ensure scrolling works by using setTimeout to allow DOM to update
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 10);
}

function sendVoice(user_input) {
    fetch('/process_voice', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({user_input})
    })
    .then(res => res.json())
    .then(data => {
        addBubble('ai', data.response);
        speakText(data.response);
        recordingStatus.innerHTML = '<i class="fas fa-hand-point-up"></i> Click to speak';
        statusElement.textContent = "Ready to listen";
    })
    .catch(error => {
        console.error('Error:', error);
        recordingStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error. Try again.';
        statusElement.textContent = "Error occurred";
    });
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        recordingStatus.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
        statusElement.textContent = "AI is speaking";
        
        utterance.onend = () => {
            recordingStatus.innerHTML = '<i class="fas fa-hand-point-up"></i> Click to speak';
            statusElement.textContent = "Ready to listen";
        };
        
        window.speechSynthesis.speak(utterance);
    }
}