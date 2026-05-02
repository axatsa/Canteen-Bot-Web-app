import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RequestDetailModal } from '../RequestDetailModal';
import { api } from '@/utils/api';
import '@testing-library/jest-dom';

// Mock the API
vi.mock('@/utils/api', () => ({
  api: {
    getFinancierOrderDetails: vi.fn()
  }
}));

describe('RequestDetailModal', () => {
  const mockOrderData = {
    order: {
      id: 'order-12345678',
      created_at: '2026-05-01T10:00:00Z',
      branch: 'beltepa_land',
      status: 'sent_to_financier'
    },
    delivery: {
      total_ordered_sum: 1000000,
      total_received_sum: 950000
    },
    ordered_products: [],
    delivered_items: [],
    not_delivered_items: [],
    extra_items: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with 3 meta-cards (Дата, Тип, Статус) and NO "Выполнение"', async () => {
    (api.getFinancierOrderDetails as any).mockResolvedValue(mockOrderData);

    render(
      <RequestDetailModal 
        orderId="order-12345678" 
        onClose={vi.fn()} 
        templates={[]} 
      />
    );

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });

    // Check meta-cards
    expect(screen.getByText('Дата')).toBeInTheDocument();
    expect(screen.getByText('Тип')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();

    // Verify "Выполнение" is NOT present
    expect(screen.queryByText('Выполнение')).not.toBeInTheDocument();
    
    // Check if it shows "Садик" for land branch
    expect(screen.getByText('Садик')).toBeInTheDocument();
    
    // Check sums
    expect(screen.getByText(/Заявлено: 1,000,000 UZS/)).toBeInTheDocument();
    expect(screen.getByText(/950,000/)).toBeInTheDocument();
  });
});
