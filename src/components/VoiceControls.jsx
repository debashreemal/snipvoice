import React, { useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Voice input controls using browser built-in Web Speech API with explicit permission handling
export default function VoiceControls({
  speechLang,
  onLangChange,
  isListening,
  setIsListening,
  onLiveTranscript,
  onSpeechEndAndSend,
  micError,
  setMicError,
  disabled,
}) {
  const recognitionRef = useRef(null);
  const transcriptBufferRef = useRef('');
  const silenceTimerRef = useRef(null);

  // If SpeechRecognition is not supported by the browser, render nothing
  if (!SpeechRecognition) {
    return null;
  }

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const stopListening = (sendIfPresent = true) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);

    const finalRecorded = transcriptBufferRef.current.trim();
    if (sendIfPresent && finalRecorded) {
      onSpeechEndAndSend(finalRecorded);
    }
  };

  const startListening = async () => {
    if (disabled) return;
    setMicError(null);
    transcriptBufferRef.current = '';

    // 1. Explicitly prompt / verify microphone permission so browser doesn't block silently
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop temporary mic tracks so SpeechRecognition can take over the device
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Microphone permission check failed:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicError(
            'Microphone is blocked. Allow it in your browser settings, or type your question.'
          );
        } else {
          setMicError('No microphone found. Please connect a microphone or type your question.');
        }
        setIsListening(false);
        return;
      }
    }

    // 2. Abort any previous recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang || 'hi-IN';
      recognition.interimResults = true;
      recognition.continuous = true; // Stay active while user speaks, don't drop on 1-second pause
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }

        transcriptBufferRef.current = fullTranscript;
        onLiveTranscript(fullTranscript);

        // Auto-send debounce: when user pauses for 1.8 seconds after speaking, automatically send!
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          stopListening(true);
        }, 1800);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'no-speech') {
          // Do not abort if user is still preparing to speak
          return;
        }

        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError(
            'Microphone is blocked. Allow it in your browser settings, or type your question.'
          );
        } else if (event.error === 'audio-capture') {
          setMicError('No microphone found. Please connect a microphone or type your question.');
        } else if (event.error === 'network') {
          setMicError('Speech recognition service network error. Please type your question.');
        }
      };

      recognition.onend = () => {
        // Recognition completed or stopped
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      recognition.start();
    } catch (err) {
      console.error('Failed to start SpeechRecognition:', err);
      setIsListening(false);
      setMicError('Could not initialize speech recognition. Please type your question.');
    }
  };

  return (
    <div className="voice-controls-group">
      {/* Language Toggle: Hindi | English */}
      <div className="speech-lang-toggle" title="Speech recognition language">
        <button
          type="button"
          className={`speech-lang-btn ${speechLang === 'hi-IN' ? 'is-selected' : ''}`}
          onClick={() => onLangChange('hi-IN')}
          disabled={isListening || disabled}
        >
          Hindi
        </button>
        <span className="speech-lang-divider">|</span>
        <button
          type="button"
          className={`speech-lang-btn ${speechLang === 'en-IN' ? 'is-selected' : ''}`}
          onClick={() => onLangChange('en-IN')}
          disabled={isListening || disabled}
        >
          English
        </button>
      </div>

      {/* Mic Button: "Speak" (Mic icon) or "Stop listening" (Square icon) */}
      {isListening ? (
        <button
          type="button"
          className="btn-mic is-listening"
          onClick={() => stopListening(true)}
          title="Stop listening and send"
        >
          <Square size={14} strokeWidth={2.4} />
          <span>Stop listening</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn-mic"
          onClick={startListening}
          disabled={disabled}
          title="Speak your question"
        >
          <Mic size={14} strokeWidth={2.4} />
          <span>Speak</span>
        </button>
      )}
    </div>
  );
}
