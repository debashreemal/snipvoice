import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// Voice input controls using browser built-in Web Speech API
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

  // If SpeechRecognition is not supported by the browser, render nothing
  if (!SpeechRecognition) {
    return null;
  }

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const startListening = () => {
    if (disabled) return;
    setMicError(null);
    transcriptBufferRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        transcriptBufferRef.current = transcript;
        onLiveTranscript(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError(
            'Microphone is blocked. Allow it in your browser settings, or type your question.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalRecorded = transcriptBufferRef.current.trim();
        if (finalRecorded) {
          onSpeechEndAndSend(finalRecorded);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
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
          onClick={stopListening}
          title="Stop listening"
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
