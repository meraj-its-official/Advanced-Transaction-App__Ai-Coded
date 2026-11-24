'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { cn } from './utils';

export interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  masked?: boolean;
  disabled?: boolean;
}

export function PinInput({
  length = 6,
  value,
  onChange,
  error,
  label,
  masked = true,
  disabled = false,
}: PinInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(-1);

  const digits = value.padEnd(length, '').slice(0, length).split('');

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('').replace(/\s/g, '');
    onChange(newValue);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join('').replace(/\s/g, ''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join('').replace(/\s/g, ''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-slate-300">{label}</label>}
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => { inputsRef.current[index] = el; }}
            type={masked ? 'password' : 'text'}
            inputMode="numeric"
            maxLength={1}
            value={digits[index] === ' ' || !digits[index] ? '' : digits[index]}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocused(index)}
            onBlur={() => setFocused(-1)}
            disabled={disabled}
            className={cn(
              'w-11 h-13 text-center text-xl font-bold rounded-xl',
              'bg-[#1e1e2e] border-2 text-slate-100',
              'transition-all duration-150',
              'focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              focused === index
                ? 'border-primary-500 shadow-sm shadow-primary-500/30'
                : digits[index] && digits[index] !== ' '
                ? 'border-primary-500/50'
                : error
                ? 'border-red-500/50'
                : 'border-[#2d2d44]'
            )}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-400 text-center">&#9888; {error}</p>
      )}
    </div>
  );
}
