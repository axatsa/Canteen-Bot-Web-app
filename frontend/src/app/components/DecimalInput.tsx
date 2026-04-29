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
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        if (input === '') {
            onChange(0);
            return;
        }

        // Только целые числа
        const num = parseInt(input, 10);

        if (isNaN(num)) {
            return;
        }

        let finalValue = num;

        if (typeof min === 'number') {
            finalValue = Math.max(min, finalValue);
        }

        if (typeof max === 'number') {
            finalValue = Math.min(max, finalValue);
        }

        onChange(finalValue);
    };

    const displayValue = value === 0 ? '' : Math.floor(value).toString();

    return (
        <input
            type="number"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            min={typeof min === 'number' ? min : undefined}
            max={typeof max === 'number' ? max : undefined}
        />
    );
}
