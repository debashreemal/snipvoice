import React, { useState } from 'react';
import { Settings, X, Check, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function SettingsModal({ onClose }) {
  const { resetDemoData } = useAppContext();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleExecuteReset = async () => {
    if (confirmText !== 'RESET') return;
    setIsResetting(true);
    setErrorMessage(null);

    try {
      await resetDemoData();
      setSuccessMessage('Demo data cleared.');
      setIsConfirming(false);
      setConfirmText('');
    } catch (err) {
      console.error('Reset error:', err);
      setErrorMessage('Could not reset demo data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <div className="settings-title-group">
            <Settings size={18} strokeWidth={2.4} />
            <h3 className="settings-title">Settings</h3>
          </div>
          <button
            type="button"
            className="btn-settings-close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* Success Feedback */}
        {successMessage && (
          <div className="settings-success-pill">
            <Check size={14} strokeWidth={2.8} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="settings-error-pill">
            <AlertTriangle size={14} strokeWidth={2.4} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Reset Demo Section */}
        <div className="settings-section">
          <h4 className="settings-section-title">Demo & Data Management</h4>
          <p className="settings-section-sub">
            Clear learned voice notes, manual edits, and match trend history while keeping your projects intact.
          </p>

          {!isConfirming ? (
            <button
              type="button"
              className="btn-reset-demo"
              onClick={() => {
                setIsConfirming(true);
                setSuccessMessage(null);
              }}
            >
              Reset demo data
            </button>
          ) : (
            <div className="settings-confirm-box">
              <p className="settings-confirm-text">
                This clears learned notes, edits and trend data. Your projects stay. Type <strong>RESET</strong> to confirm.
              </p>
              <input
                type="text"
                className="settings-confirm-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type RESET"
                autoFocus
              />
              <div className="settings-confirm-actions">
                <button
                  type="button"
                  className="btn-confirm-reset"
                  disabled={confirmText !== 'RESET' || isResetting}
                  onClick={handleExecuteReset}
                >
                  {isResetting ? 'Resetting...' : 'Confirm reset'}
                </button>
                <button
                  type="button"
                  className="btn-cancel-reset"
                  onClick={() => {
                    setIsConfirming(false);
                    setConfirmText('');
                  }}
                  disabled={isResetting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
