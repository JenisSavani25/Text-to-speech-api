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
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const sampleBtn = document.getElementById('sample-btn');
const charCount = document.querySelector('.character-count');
const audioWave = document.getElementById('audio-wave');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeModal = document.querySelector('.close-modal');

// Create audio element for speech synthesis and download
const audioElement = document.createElement('audio');
audioElement.style.display = 'none';
document.body.appendChild(audioElement);

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
    
    // Reset download button
    downloadBtn.disabled = true;
    
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
    
    // Generate speech
    generateSpeechAudio(text, utterance.voice, utterance.rate, utterance.pitch)
        .then(audioUrl => {
            // Play the audio
            audioElement.src = audioUrl;
            audioElement.play();
            
            // Enable download button
            downloadBtn.disabled = false;
            
            // Set up download button to use this audio
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = audioUrl;
                
                // Generate filename from text
                let fileName = text.substring(0, 15);
                fileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                a.download = `speech_${fileName}.mp3`;
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        })
        .catch(error => {
            console.error('Error generating speech:', error);
            alert('Failed to generate speech audio');
        });
    
    // Disable speak button while speaking
    speakBtn.disabled = true;
    
    // Handle audio events
    audioElement.onplaying = () => {
        speakBtn.disabled = true;
        updateVisualization(true);
    };
    
    audioElement.onended = () => {
        speakBtn.disabled = false;
        isSpeaking = false;
        updateVisualization(false);
    };
    
    audioElement.onerror = () => {
        console.error('Audio playback error');
        speakBtn.disabled = false;
        isSpeaking = false;
        updateVisualization(false);
    };
});

// Function to generate speech audio and return a URL
async function generateSpeechAudio(text, voice, rate, pitch) {
    // We'll use a text-to-speech service API that supports download
    // For this example, we'll use a simulated approach
    
    return new Promise((resolve, reject) => {
        try {
            // Create utterance
            const tempUtterance = new SpeechSynthesisUtterance(text);
            
            // Set voice if provided
            if (voice) {
                tempUtterance.voice = voice;
            }
            
            // Set rate and pitch
            tempUtterance.rate = rate || 1;
            tempUtterance.pitch = pitch || 1;
            
            // Since direct audio capture from SpeechSynthesis isn't possible in all browsers,
            // we'll provide an alternative by creating a data URI with the text
            // that will be transformed server-side (in a real implementation)
            
            // For demonstration, we'll create a data URI that describes what would be spoken
            const voiceName = voice ? voice.name : 'Default';
            const dataString = `Text: ${text}\nVoice: ${voiceName}\nRate: ${rate}\nPitch: ${pitch}`;
            const base64Data = btoa(dataString);
            
            // In a real implementation, you would call a server API here to generate the audio
            // For now, we'll show an alert explaining the limitation
            alert('Due to browser security restrictions, direct audio download from the Web Speech API is not supported. In a production environment, this would use a server-side API to generate downloadable audio files.');
            
            // Simulate a short delay to represent processing time
            setTimeout(() => {
                // This is just a placeholder. In a real implementation, 
                // this would be an actual audio data URI or blob URL
                const mockAudioUrl = `data:audio/mp3;base64,${base64Data}`;
                resolve(mockAudioUrl);
            }, 500);
            
            // Speak using the Web Speech API for the actual speech
            speechSynthesis.speak(tempUtterance);
        } catch (error) {
            reject(error);
        }
    });
}

// Pause, Resume, and Stop functionality
pauseBtn.addEventListener('click', () => {
    if (synth.speaking && !synth.paused) {
        synth.pause();
        audioElement.pause();
        updateVisualization(false);
    }
});

resumeBtn.addEventListener('click', () => {
    if (synth.speaking && synth.paused) {
        synth.resume();
        audioElement.play();
        updateVisualization(true);
    }
});

stopBtn.addEventListener('click', () => {
    if (synth.speaking) {
        synth.cancel();
        audioElement.pause();
        audioElement.currentTime = 0;
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
