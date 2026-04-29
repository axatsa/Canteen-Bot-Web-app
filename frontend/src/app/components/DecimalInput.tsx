import { useState, useEffect, useRef } from 'react';

interface DecimalInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
}

export function DecimalInput({
    value,
    onChange,
    placeholder = '0',
    className = '',
    disabled = false,
    min = 0,
    max,
}: DecimalInputProps) {
    const toDisplay = (n: number) => n === 0 ? '' : String(n).replace('.', ',');

    const [display, setDisplay] = useState(() => toDisplay(value));
    const focused = useRef(false);
    const prevExternal = useRef(value);

    // Sync when external value changes (e.g. +/- button) but not while typing
    useEffect(() => {
        if (!focused.current && value !== prevExternal.current) {
            prevExternal.current = value;
            setDisplay(toDisplay(value));
        }
    }, [value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        focused.current = true;
        e.target.select();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/[^0-9.,]/g, '');

        // Allow only one decimal separator
        const separators = (raw.match(/[.,]/g) || []).length;
        if (separators > 1) return;

        setDisplay(raw);

        const normalized = raw.replace(',', '.');
        const num = parseFloat(normalized);

        // Don't emit while user is still typing the decimal part (e.g. "3.")
        if (!isNaN(num) && !normalized.endsWith('.')) {
            let clamped = num;
            if (typeof min === 'number') clamped = Math.max(min, clamped);
            if (typeof max === 'number') clamped = Math.min(max, clamped);
            prevExternal.current = clamped;
            onChange(clamped);
        } else if (raw === '') {
            prevExternal.current = 0;
            onChange(0);
        }
    };

    const handleBlur = () => {
        focused.current = false;
        const normalized = display.replace(',', '.');
        const num = parseFloat(normalized);
        if (isNaN(num) || display === '') {
            prevExternal.current = 0;
            onChange(0);
            setDisplay('');
        } else {
            let clamped = num;
            if (typeof min === 'number') clamped = Math.max(min, clamped);
            if (typeof max === 'number') clamped = Math.min(max, clamped);
            prevExternal.current = clamped;
            onChange(clamped);
            setDisplay(toDisplay(clamped));
        }
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={display}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
}
