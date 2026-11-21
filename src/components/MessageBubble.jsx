import React, { useState } from 'react';
import { Volume2, Square, Copy, Check, RotateCcw } from 'lucide-react';

// Format text with bold summary and bullet points
function renderFormattedAnswer(text) {
  if (!text) return null;

  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const elements = [];
  const bullets = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const cleanBullet = trimmed.replace(/^[-*]\s+/, '');
      bullets.push(cleanBullet);
    } else {
      // Bold summary or regular text line
      const cleanLine = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
      const isBold = trimmed.startsWith('**') && trimmed.endsWith('**');
      elements.push(
        <div
          key={`line-${index}`}
          className={`ask-answer-summary ${isBold ? 'is-bold' : ''}`}
        >
          {cleanLine}
        </div>
      );
    }
  });

  if (bullets.length > 0) {
    elements.push(
      <ul key="bullets-list" className="ask-answer-bullets">
        {bullets.map((b, bIdx) => (
          <li key={`bullet-${bIdx}`} className="ask-answer-bullet-item">
            {b}
          </li>
        ))}
      </ul>
    );
  }

  return elements;
}

// Single chat message bubble supporting user questions, SnipVoice answers, and error states
export default function MessageBubble({
  message,
  onListen,
  onStopListening,
  isSpeakingThis,
  onRetry,
}) {
  const { sender, text, sources, isError } = message;
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);

  // Copy answer text to clipboard
  const handleCopy = async () => {
    if (!text) return;
    try {
      // Copy clean text without markdown asterisks
      const plainText = text.replace(/\*\*/g, '');
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn('Could not copy to clipboard:', err);
    }
  };

  // 1. Error Message State
  if (isError) {
    return (
      <div className="ask-message-row is-assistant">
        <div className="ask-bubble ask-error-bubble">
          <p className="ask-error-text">Could not answer right now.</p>
          {onRetry && (
            <button
              type="button"
              className="btn-ask-retry"
              onClick={onRetry}
              title="Try asking again"
            >
              <RotateCcw size={13} strokeWidth={2.4} />
              <span>Try again</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. User Message
  if (isUser) {
    return (
      <div className="ask-message-row is-user">
        <div className="ask-bubble ask-user-bubble">{text}</div>
      </div>
    );
  }

  // 3. SnipVoice Assistant Answer
  return (
    <div className="ask-message-row is-assistant">
      <div className="ask-bubble ask-assistant-bubble">
        {/* Answer Content: Bold summary line + up to 3 bullets */}
        <div className="ask-answer-content">{renderFormattedAnswer(text)}</div>

        {/* Action Row: Listen / Stop & Copy */}
        <div className="ask-action-row">
          {isSpeakingThis ? (
            <button
              type="button"
              className="btn-ask-action is-active"
              onClick={onStopListening}
              title="Stop speaking"
            >
              <Square size={13} strokeWidth={2.4} />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-ask-action"
              onClick={() => onListen(text)}
              title="Listen to this answer"
            >
              <Volume2 size={13} strokeWidth={2.4} />
              <span>Listen</span>
            </button>
          )}

          <button
            type="button"
            className="btn-ask-action"
            onClick={handleCopy}
            title="Copy answer to clipboard"
          >
            {copied ? (
              <>
                <Check size={13} strokeWidth={2.6} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} strokeWidth={2.4} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Based on: sources line */}
        {sources && sources.length > 0 && (
          <div className="ask-sources-row">
            <span className="ask-sources-label">Based on:</span>
            <div className="ask-sources-tags">
              {sources.map((src, idx) => (
                <span key={`${src}-${idx}`} className="ask-source-tag">
                  {src}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
