import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleSelector } from '../RoleSelector';

// Mock dependencies
vi.mock('@/app/context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'chef': '👨‍🍳 Шеф-повар',
        'snabjenec': '📦 Снабженец',
        'financier': '💼 Финансист',
        'supplier': '🚚 Поставщик',
        'appTitle': 'Optimizer',
        'selectRole': 'Выберите роль'
      };
      return keys[key] || key;
    }
  })
}));

vi.mock('@/assets/logo.png', () => ({
  default: 'test-logo.png'
}));

describe('RoleSelector', () => {
  const mockOnSelectRole = vi.fn();
  const mockOnBack = vi.fn();

  it('renders all role buttons', () => {
    render(<RoleSelector onSelectRole={mockOnSelectRole} onBack={mockOnBack} />);
    
    expect(screen.getByText('👨‍🍳 Шеф-повар')).toBeInTheDocument();
    expect(screen.getByText('📦 Снабженец')).toBeInTheDocument();
    expect(screen.getByText('💼 Финансист')).toBeInTheDocument();
    expect(screen.getByText('🚚 Поставщик')).toBeInTheDocument();
  });

  it('calls onSelectRole with "chef" when Chef button is clicked', () => {
    render(<RoleSelector onSelectRole={mockOnSelectRole} onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByText('👨‍🍳 Шеф-повар'));
    expect(mockOnSelectRole).toHaveBeenCalledWith('chef');
  });

  it('calls onSelectRole with "financier" when Financier button is clicked', () => {
    render(<RoleSelector onSelectRole={mockOnSelectRole} onBack={mockOnBack} />);
    
    fireEvent.click(screen.getByText('💼 Финансист'));
    expect(mockOnSelectRole).toHaveBeenCalledWith('financier');
  });
});
