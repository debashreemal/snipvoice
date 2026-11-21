import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Volume2, AlertCircle } from 'lucide-react';
import VoiceControls from './VoiceControls';

// Input bar fixed at bottom of Ask SnipVoice panel
export default function ChatInput({
  onSendMessage,
  isWaiting,
  speechLang,
  onSpeechLangChange,
  readAloud,
  onToggleReadAloud,
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState(null);
  const textareaRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isWaiting) return;
    onSendMessage(trimmed);
    setInputText('');
    setMicError(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Called live as words are recognized by speech recognition
  const handleLiveTranscript = (transcript) => {
    setInputText(transcript);
  };

  // Called when speech recognition automatically finishes
  const handleSpeechEndAndSend = (finalText) => {
    if (finalText && !isWaiting) {
      onSendMessage(finalText);
      setInputText('');
    }
  };

  const isSendDisabled = isWaiting || inputText.trim().length === 0;

  return (
    <div className="ask-input-bar">
      {/* Listening status indicator line */}
      {isListening && (
        <div className="ask-listening-indicator">
          <span className="ask-listening-pulse" />
          <span>Listening... speak your question</span>
        </div>
      )}

      {/* Mic permission error callout */}
      {micError && (
        <div className="ask-mic-error-pill">
          <AlertCircle size={14} strokeWidth={2.4} />
          <span>{micError}</span>
        </div>
      )}

      {/* Main text box */}
      <div className="ask-textarea-container">
        <textarea
          ref={textareaRef}
          className="ask-textarea"
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your posts, clips or results"
          disabled={isWaiting}
        />
      </div>

      {/* Controls row: Voice controls on left, Send button on right */}
      <div className="ask-input-controls-row">
        <VoiceControls
          speechLang={speechLang}
          onLangChange={onSpeechLangChange}
          isListening={isListening}
          setIsListening={setIsListening}
          onLiveTranscript={handleLiveTranscript}
          onSpeechEndAndSend={handleSpeechEndAndSend}
          micError={micError}
          setMicError={setMicError}
          disabled={isWaiting}
        />

        <button
          type="button"
          className="btn-ask-send"
          onClick={handleSend}
          disabled={isSendDisabled}
          title="Send question (Enter)"
        >
          <span>Send</span>
          <ArrowUp size={15} strokeWidth={2.6} />
        </button>
      </div>

      {/* Bottom Sub-row: "Read answers aloud" toggle */}
      <div className="ask-read-aloud-row">
        <label className="ask-read-aloud-label" htmlFor="toggle-read-aloud">
          <input
            id="toggle-read-aloud"
            type="checkbox"
            className="ask-read-aloud-checkbox"
            checked={readAloud}
            onChange={(e) => onToggleReadAloud(e.target.checked)}
          />
          <Volume2 size={13} strokeWidth={2.4} />
          <span>Read answers aloud</span>
        </label>
      </div>
    </div>
  );
}
