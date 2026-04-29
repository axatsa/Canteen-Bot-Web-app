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
        let input = e.target.value;

        if (input === '' || input === '-') {
            onChange(0);
            return;
        }

        // Заменяем запятую на точку
        input = input.replace(/,/g, '.');

        // Удаляем все символы кроме цифр и точки
        input = input.replace(/[^\d.]/g, '');

        // Удаляем дополнительные точки (оставляем только первую)
        const parts = input.split('.');
        if (parts.length > 2) {
            input = parts[0] + '.' + parts.slice(1).join('');
        }

        if (input === '' || input === '.') {
            onChange(0);
            return;
        }

        const num = parseFloat(input);

        if (isNaN(num)) {
            onChange(0);
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

    const displayValue = value === 0 ? '' : value.toString().replace('.', ',');

    return (
        <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
}
