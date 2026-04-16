
// Use Docker service name 'api' for container-to-container communication
// For local development outside Docker, use 'localhost:8000'
export const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api'  // Nginx proxy to backend
    : 'http://localhost:8000';     // Local development


export type Product = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    price?: number;
    comment?: string;
    checked?: boolean;
    chefComment?: string;
    deliveryDate?: string;
    lastPrice?: number;
    received?: boolean;
    expectedDate?: string;
};

export type Status =
    | 'sent_to_chef'
    | 'review_snabjenec'
    | 'sent_to_supplier'
    | 'waiting_snabjenec_receive'
    | 'sent_to_financier'
    | 'archived'
    | 'supplier_collecting'
    | 'supplier_delivering'
    | 'chef_checking'
    | 'financier_checking'
    | 'completed';

export type Role = 'chef' | 'financier' | 'supplier' | 'snabjenec';

export type Branch = 'chilanzar' | 'uchtepa' | 'shayzantaur' | 'olmazar';

export type Order = {
    id: string;
    status: Status;
    products: Product[];
    createdAt: Date;
    deliveredAt?: Date;
    estimatedDeliveryDate?: Date;
    branch: Branch;
};

export const api = {
    API_URL,
    getProducts: async (): Promise<Product[]> => {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },

    getOrders: async (): Promise<Order[]> => {
        const response = await fetch(`${API_URL}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        return data.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : undefined,
            estimatedDeliveryDate: o.estimatedDeliveryDate ? new Date(o.estimatedDeliveryDate) : undefined,
        }));
    },

    upsertOrder: async (order: Order): Promise<void> => {
        const payload = {
            ...order,
            createdAt: order.createdAt.toISOString(),
            deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : undefined,
            estimatedDeliveryDate: order.estimatedDeliveryDate ? order.estimatedDeliveryDate.toISOString() : undefined,
        };
        const response = await fetch(`${API_URL}/orders/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to upsert order');
    },

    registerUser: async (user: { telegram_id: number; full_name: string; role: string; branch: string; language?: string }): Promise<void> => {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...user, language: user.language || 'ru' }),
        });
        if (!response.ok) throw new Error('Failed to register user');
    }
};
