import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArchiveTable } from '../ArchiveTable';
import '@testing-library/jest-dom';

describe('ArchiveTable', () => {
  const mockOrders = [
    {
      id: 'order-1',
      created_at: '2026-05-01T10:00:00Z',
      branch: 'beltepa_land',
      total_ordered_sum: 1250000,
      total_received_sum: 0,
      sent_to_supplier_at: '2026-05-01 11:00',
      received_from_supplier_at: '2026-05-01 12:00'
    }
  ];

  it('renders table headers correctly', () => {
    render(<ArchiveTable orders={mockOrders} onSelectOrder={vi.fn()} />);
    
    expect(screen.getByText('№')).toBeInTheDocument();
    expect(screen.getByText('Дата создания')).toBeInTheDocument();
    expect(screen.getByText('Филиал')).toBeInTheDocument();
    expect(screen.getByText('Сумма')).toBeInTheDocument();
  });

  it('displays total_ordered_sum correctly', () => {
    render(<ArchiveTable orders={mockOrders} onSelectOrder={vi.fn()} />);
    
    // 1,250,000 UZS
    expect(screen.getByText(/1,250,000/)).toBeInTheDocument();
    expect(screen.getByText('UZS')).toBeInTheDocument();
  });

  it('renders "Архив пуст" when no orders are provided', () => {
    render(<ArchiveTable orders={[]} onSelectOrder={vi.fn()} />);
    expect(screen.getByText('Архив пуст')).toBeInTheDocument();
  });
});
