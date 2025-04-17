// Initialize speech synthesis
const synth = window.speechSynthesis;
let utterance = null;
let isSpeaking = false;

// Get DOM elements
const textInput = document.getElementById('text-to-speak');
const voiceSelect = document.getElementById('voices');
const languageFilter = document.getElementById('language-filter');
const rateInput = document.getElementById('rate');
const rateValue = document.getElementById('rate-value');
const pitchInput = document.getElementById('pitch');
const pitchValue = document.getElementById('pitch-value');
const speakBtn = document.getElementById('speak-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const stopBtn = document.getElementById('stop-btn');
const clearBtn = document.getElementById('clear-btn');
const sampleBtn = document.getElementById('sample-btn');
const charCount = document.querySelector('.character-count');
const audioWave = document.getElementById('audio-wave');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModal = document.querySelector('.close-modal');

// Sample texts
const sampleTexts = [
    "Welcome to the text-to-speech converter. This tool allows you to convert any written text into spoken words using your browser's built-in speech synthesis capabilities.",
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter in the English alphabet.",
    "Artificial intelligence is transforming how we interact with technology. Voice interfaces are becoming increasingly common in our daily lives.",
    "Hello world! This is a simple test of the text-to-speech functionality. You can adjust the voice, rate, and pitch to customize how it sounds."
];

// Populate voice dropdown
let voices = [];
let languages = new Set();

function populateVoices() {
    voices = synth.getVoices();
    
    // Clear existing options
    voiceSelect.innerHTML = '';
    languages.clear();
    languageFilter.innerHTML = '<option value="all">All Languages</option>';
    
    // Group voices by language
    const voicesByLang = {};
    
    voices.forEach(voice => {
        // Extract language code and name
        const langCode = voice.lang.split('-')[0];
        const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode);
        
        if (!voicesByLang[langCode]) {
            voicesByLang[langCode] = {
                name: langName,
                voices: []
            };
            languages.add(langCode);
        }
        
        voicesByLang[langCode].voices.push(voice);
    });
    
    // Add language options to filter
    languages.forEach(lang => {
        const langName = voicesByLang[lang].name;
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = langName;
        languageFilter.appendChild(option);
    });
    
    // Add all voices to select
    voices.forEach(voice => {
        const option = document.createElement('option');
        const langCode = voice.lang.split('-')[0];
        const langName = voicesByLang[langCode].name;
        
        option.textContent = `${voice.name} (${langName})`;
        option.setAttribute('data-lang', langCode);
        option.setAttribute('data-name', voice.name);
        voiceSelect.appendChild(option);
    });
    
    // Select a default voice (preferably English)
    const defaultVoice = voices.findIndex(voice => voice.lang.includes('en-US'));
    if (defaultVoice !== -1) {
        voiceSelect.selectedIndex = defaultVoice;
    }
}

// Language filter functionality
languageFilter.addEventListener('change', () => {
    const selectedLang = languageFilter.value;
    
    Array.from(voiceSelect.options).forEach(option => {
        const optionLang = option.getAttribute('data-lang');
        
        if (selectedLang === 'all' || optionLang === selectedLang) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
    
    // Select first visible option
    const firstVisible = Array.from(voiceSelect.options).find(option => option.style.display !== 'none');
    if (firstVisible) {
        firstVisible.selected = true;
    }
});

// Chrome loads voices asynchronously
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoices;
}

// Call once for Firefox and other browsers
populateVoices();

// Character count
textInput.addEventListener('input', () => {
    const count = textInput.value.length;
    charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
});

// Update rate and pitch display values
rateInput.addEventListener('input', () => {
    rateValue.textContent = `${rateInput.value}x`;
});

pitchInput.addEventListener('input', () => {
    pitchValue.textContent = pitchInput.value;
});

// Clear button
clearBtn.addEventListener('click', () => {
    textInput.value = '';
    charCount.textContent = '0 characters';
    textInput.focus();
});

// Sample text button
sampleBtn.addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    textInput.value = sampleTexts[randomIndex];
    charCount.textContent = `${textInput.value.length} characters`;
});

// Update audio visualization
function updateVisualization(speaking) {
    if (speaking) {
        audioWave.classList.add('speaking');
    } else {
        audioWave.classList.remove('speaking');
    }
}

// Speak function
speakBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    
    if (!text) {
        alert('Please enter some text to speak');
        textInput.focus();
        return;
    }
    
    // Cancel any ongoing speech
    if (synth.speaking) {
        synth.cancel();
    }
    
    // Create a new utterance
    utterance = new SpeechSynthesisUtterance(text);
    
    // Set selected voice
    if (voiceSelect.selectedOptions.length > 0) {
        const selectedVoice = voiceSelect.selectedOptions[0].getAttribute('data-name');
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
            utterance.voice = voice;
        }
    }
    
    // Set rate and pitch
    utterance.rate = parseFloat(rateInput.value);
    utterance.pitch = parseFloat(pitchInput.value);
    
    // Start visualization
    isSpeaking = true;
    updateVisualization(true);
    
    // Speak
    synth.speak(utterance);
    
    // Disable speak button while speaking
    utterance.onstart = () => {
        speakBtn.disabled = true;
    };
    
    // Enable speak button when done
    utterance.onend = () => {
        speakBtn.disabled = false;
        isSpeaking = false;
        updateVisualization(false);
    };
    
    // Handle errors
    utterance.onerror = (event) => {
        console.error('SpeechSynthesis Error:', event.error);
        speakBtn.disabled = false;
        isSpeaking = false;
        updateVisualization(false);
    };
});

// Pause, Resume, and Stop functionality
pauseBtn.addEventListener('click', () => {
    if (synth.speaking && !synth.paused) {
        synth.pause();
        updateVisualization(false);
    }
});

resumeBtn.addEventListener('click', () => {
    if (synth.speaking && synth.paused) {
        synth.resume();
        updateVisualization(true);
    }
});

stopBtn.addEventListener('click', () => {
    if (synth.speaking) {
        synth.cancel();
        speakBtn.disabled = false;
        isSpeaking = false;
        updateVisualization(false);
    }
});

// Modal functionality
helpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    helpModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => {
    helpModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === helpModal) {
        helpModal.style.display = 'none';
    }
});

// Key shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape' && helpModal.style.display === 'flex') {
        helpModal.style.display = 'none';
    }
    
    // Ctrl+Enter to speak
    if (e.ctrlKey && e.key === 'Enter' && !speakBtn.disabled) {
        speakBtn.click();
    }
});

// Initial character count
charCount.textContent = '0 characters';

// Set initial sample text
textInput.value = "Hello! This is a text-to-speech application. Type something here and click 'Speak' to hear it, or try the controls to customize the voice.";
charCount.textContent = `${textInput.value.length} characters`; 