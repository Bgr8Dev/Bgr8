import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './PasswordInput.css';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  showStrengthMeter?: boolean;
  passwordStrength?: any; // PasswordStrength type
  className?: string;
  showSuggestions?: boolean;
  onUseSuggestion?: (password: string) => void;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Enter password',
  label,
  required = false,
  disabled = false,
  showStrengthMeter = false,
  passwordStrength,
  className = '',
  showSuggestions = false,
  onUseSuggestion
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={`password-input-wrapper ${className}`}>
      {label && (
        <label htmlFor={id} className="password-input-label">
          {label}
        </label>
      )}
      <div className="password-input-container">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="password-input-field"
          autoComplete="new-password"
        />
        <div className="password-input-actions">
          {showSuggestions && (
            <button
              type="button"
              className="password-suggestions-toggle"
              onClick={() => setShowSuggestionsList(!showSuggestionsList)}
              disabled={disabled}
              aria-label="Show password suggestions"
              title="Get password suggestions"
            >
              💡
            </button>
          )}
          <button
            type="button"
            className="password-visibility-toggle"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>
      {showSuggestionsList && showSuggestions && onUseSuggestion && (
        <PasswordSuggestions onUseSuggestion={onUseSuggestion} />
      )}
      {showStrengthMeter && passwordStrength && (
        <div className="password-strength-container">
          {/* This will be rendered by the parent component */}
        </div>
      )}
    </div>
  );
}

// Password Suggestions Component
import { generatePasswordSuggestions, generatePassphraseSuggestions } from '../../utils/passwordSuggestions';

interface PasswordSuggestionsProps {
  onUseSuggestion: (password: string) => void;
}

function PasswordSuggestions({ onUseSuggestion }: PasswordSuggestionsProps) {
  const [suggestions] = useState(() => [
    ...generatePasswordSuggestions(3),
    ...generatePassphraseSuggestions(1)
  ]);

  return (
    <div className="password-suggestions-dropdown">
      <div className="password-suggestions-header">
        <strong>Password Suggestions</strong>
        <p className="password-suggestions-subtitle">Click to use a suggestion</p>
      </div>
      <div className="password-suggestions-list">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            className="password-suggestion-item"
            onClick={() => onUseSuggestion(suggestion.password)}
          >
            <div className="password-suggestion-password">
              <code>{suggestion.password}</code>
              <span className={`password-suggestion-strength ${suggestion.strength.toLowerCase().replace(' ', '-')}`}>
                {suggestion.strength}
              </span>
            </div>
            <div className="password-suggestion-hint">{suggestion.hint}</div>
          </button>
        ))}
      </div>
      <div className="password-suggestions-footer">
        <p>💡 These are random suggestions. Make them your own!</p>
      </div>
    </div>
  );
}

