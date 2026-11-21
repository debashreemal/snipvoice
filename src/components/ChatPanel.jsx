import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import SuggestionList from './SuggestionList';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { askSnipVoice } from '../lib/askMock';

// Strip markdown symbols for clean screen-reader and SpeechSynthesis voice output
function cleanMarkdownForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/[#_*~`]/g, '')
    .trim();
}

// "Ask SnipVoice" slide-in chat panel
export default function ChatPanel() {
  const {
    isAskChatOpen,
    setIsAskChatOpen,
    chatMessages,
    setChatMessages,
    speechLang,
    updateSpeechLang,
    readAloud,
    setReadAloud,
    clearChat,
  } = useAppContext();

  const [isThinking, setIsThinking] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [lastQuestion, setLastQuestion] = useState('');

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom whenever new messages arrive or thinking state changes
  useEffect(() => {
    if (isAskChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isThinking, isAskChatOpen]);

  // Pressing Escape closes the panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAskChatOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAskChatOpen]);

  // Stop any active speech synthesis
  const stopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  };

  const handleClose = () => {
    stopSpeech();
    setIsAskChatOpen(false);
  };

  // Speak a specific answer text aloud
  const handleListen = (text, messageId) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    stopSpeech();
    const cleanText = cleanMarkdownForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Choose Hindi voice for Hindi text, otherwise Indian English if available
    const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
    const isHindi = hasDevanagari || speechLang === 'hi-IN';

    const voices = window.speechSynthesis.getVoices() || [];
    let chosenVoice = null;

    if (isHindi) {
      chosenVoice = voices.find(
        (v) => v.lang.includes('hi') || v.lang.includes('hi-IN')
      );
    }
    if (!chosenVoice) {
      chosenVoice = voices.find(
        (v) => v.lang.includes('en-IN') || v.name.includes('India')
      );
    }
    if (!chosenVoice) {
      chosenVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
    }

    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => setSpeakingId(messageId);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Execute asking a question via askSnipVoice mock
  const handleSendQuestion = async (questionText) => {
    if (!questionText || !questionText.trim()) return;

    stopSpeech();
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText.trim(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setLastQuestion(questionText.trim());
    setIsThinking(true);

    try {
      // REPLACE WITH /api/ask
      const response = await askSnipVoice(questionText, chatMessages);

      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        sources: response.sources || [],
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);

      // Read answer aloud if user has the toggle turned ON
      if (readAloud) {
        handleListen(response.answer, assistantMsg.id);
      }
    } catch (err) {
      console.error('Ask SnipVoice failed:', err);
      setIsThinking(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: 'Could not answer right now.',
        },
      ]);
    }
  };

  const handleRetry = () => {
    if (lastQuestion) {
      handleSendQuestion(lastQuestion);
    }
  };

  const handleClear = () => {
    stopSpeech();
    clearChat();
  };

  if (!isAskChatOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile or click-outside */}
      <div className="ask-panel-backdrop" onClick={handleClose} />

      {/* Main sliding panel */}
      <aside
        className="ask-chat-panel"
        role="dialog"
        aria-label="Ask SnipVoice Chat"
      >
        {/* 1. Header (--card-dark) */}
        <header className="ask-panel-header">
          <div className="ask-header-left">
            <h2 className="ask-panel-title">Ask SnipVoice</h2>
            <p className="ask-panel-subline">
              Answers come from your own projects and results.
            </p>
          </div>
          <div className="ask-header-actions">
            {chatMessages.length > 0 && (
              <button
                type="button"
                className="btn-ask-header-text"
                onClick={handleClear}
                title="Clear all messages"
              >
                Clear chat
              </button>
            )}
            <button
              type="button"
              className="btn-ask-header-close"
              onClick={handleClose}
              title="Close panel (Escape)"
            >
              <X size={15} strokeWidth={2.4} />
              <span>Close</span>
            </button>
          </div>
        </header>

        {/* 2. Message Area (scrolls) */}
        <div className="ask-panel-messages-area">
          {chatMessages.length === 0 ? (
            <SuggestionList onSelectSuggestion={handleSendQuestion} />
          ) : (
            <div className="ask-messages-list">
              {chatMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onListen={(text) => handleListen(text, msg.id)}
                  onStopListening={stopSpeech}
                  isSpeakingThis={speakingId === msg.id}
                  onRetry={msg.isError ? handleRetry : null}
                />
              ))}

              {/* Thinking State */}
              {isThinking && (
                <div className="ask-thinking-row">
                  <div className="ask-thinking-dots">
                    <span className="dot dot-1" />
                    <span className="dot dot-2" />
                    <span className="dot dot-3" />
                  </div>
                  <span className="ask-thinking-text">Looking at your data...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. Input Bar Fixed at Bottom */}
        <ChatInput
          onSendMessage={handleSendQuestion}
          isWaiting={isThinking}
          speechLang={speechLang}
          onSpeechLangChange={updateSpeechLang}
          readAloud={readAloud}
          onToggleReadAloud={setReadAloud}
        />
      </aside>
    </>
  );
}
