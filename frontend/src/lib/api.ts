
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
    | 'completed';

export type Role = 'chef' | 'financier' | 'supplier' | 'snabjenec' | 'supplier_meat' | 'supplier_products';

export type Branch =
    | 'beltepa_land' | 'uchtepa_land' | 'rakat_land' | 'mukumiy_land' | 'yunusabad_land' | 'novoi_land'
    | 'novza_school' | 'uchtepa_school' | 'almazar_school' | 'general_uzakov_school' | 'namangan_school' | 'novoi_school';

export type DeliveryItemTracking = {
    ordered_qty: number;
    received_qty: number;
    status: 'delivered' | 'partial' | 'not_delivered' | 'pending';
};

export type Order = {
    id: string;
    status: Status;
    products: Product[];
    createdAt: Date;
    deliveredAt?: Date;
    estimatedDeliveryDate?: Date;
    branch: Branch;
    supplierResponded?: boolean;
    deliveryTracking?: Record<string, DeliveryItemTracking>;
    extraItemsDelivered?: Record<string, number>;
    sentToSupplierAt?: string;
    receivedFromSupplierAt?: string;
    chefName?: string;
    snabjenecName?: string;
    supplierName?: string;
    sentToMeatSupplier?: boolean;
    sentToProductSupplier?: boolean;
};

export const api = {
    API_URL,
    getProducts: async (): Promise<Product[]> => {
        const response = await fetch(`${API_URL}/products?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },

    getOrders: async (): Promise<Order[]> => {
        const response = await fetch(`${API_URL}/orders?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        return data.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : undefined,
            estimatedDeliveryDate: o.estimatedDeliveryDate ? new Date(o.estimatedDeliveryDate) : undefined,
            supplierResponded: o.supplierResponded ?? false,
            deliveryTracking: o.deliveryTracking ?? {},
            extraItemsDelivered: o.extraItemsDelivered ?? {},
            sentToSupplierAt: o.sentToSupplierAt,
            receivedFromSupplierAt: o.receivedFromSupplierAt,
            chefName: o.chefName ?? undefined,
            snabjenecName: o.snabjenecName ?? undefined,
            supplierName: o.supplierName ?? undefined,
            sentToMeatSupplier: o.sentToMeatSupplier ?? false,
            sentToProductSupplier: o.sentToProductSupplier ?? false,
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
    },

    // ── Delivery tracking ──────────────────────────────────────────────────────

    markSupplierReceived: async (orderId: string, receivedDate: string): Promise<void> => {
        const response = await fetch(`${API_URL}/orders/${orderId}/mark_supplier_received`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ received_date: receivedDate }),
        });
        if (!response.ok) throw new Error('Failed to mark supplier received');
    },

    updateDelivery: async (
        orderId: string,
        deliveryTracking: Record<string, DeliveryItemTracking>,
        extraItems: Record<string, number> = {}
    ): Promise<void> => {
        const response = await fetch(`${API_URL}/orders/${orderId}/update_delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delivery_tracking: deliveryTracking, extra_items: extraItems }),
        });
        if (!response.ok) throw new Error('Failed to update delivery');
    },

    archiveOrder: async (orderId: string): Promise<void> => {
        const response = await fetch(`${API_URL}/orders/${orderId}/archive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archived_by: 'snabjenec' }),
        });
        if (!response.ok) throw new Error('Failed to archive order');
    },

    // ── Financier desktop ──────────────────────────────────────────────────────

    getFinancierAllOrders: async (params?: {
        branch?: string; status?: string; limit?: number; offset?: number;
    }): Promise<any> => {
        const q = new URLSearchParams();
        if (params?.branch) q.set('branch', params.branch);
        if (params?.status) q.set('status', params.status);
        if (params?.limit !== undefined) q.set('limit', String(params.limit));
        if (params?.offset !== undefined) q.set('offset', String(params.offset));
        const response = await fetch(`${API_URL}/orders/financier/all?${q}`);
        if (!response.ok) throw new Error('Failed to fetch financier orders');
        return response.json();
    },

    getFinancierOrderDetails: async (orderId: string): Promise<any> => {
        const response = await fetch(`${API_URL}/orders/${orderId}/financier/details`);
        if (!response.ok) throw new Error('Failed to fetch order details');
        return response.json();
    },

    getFinancierStatistics: async (branch?: string): Promise<any> => {
        const q = branch ? `?branch=${branch}` : '';
        const response = await fetch(`${API_URL}/orders/financier/statistics${q}`);
        if (!response.ok) throw new Error('Failed to fetch statistics');
        return response.json();
    },

    getFinancierArchive: async (params?: { branch?: string; limit?: number; offset?: number }): Promise<any> => {
        const q = new URLSearchParams();
        if (params?.branch) q.set('branch', params.branch);
        if (params?.limit !== undefined) q.set('limit', String(params.limit));
        if (params?.offset !== undefined) q.set('offset', String(params.offset));
        const response = await fetch(`${API_URL}/orders/financier/archive?${q}`);
        if (!response.ok) throw new Error('Failed to fetch archive');
        return response.json();
    },

    // ── Templates ──────────────────────────────────────────────────────────────

    getTemplates: async (): Promise<any> => {
        const response = await fetch(`${API_URL}/templates/list`);
        if (!response.ok) throw new Error('Failed to fetch templates');
        return response.json();
    },

    uploadTemplate: async (file: File, name: string, description = ''): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('template_name', name);
        formData.append('description', description);
        const response = await fetch(`${API_URL}/templates/upload`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Failed to upload template');
        return response.json();
    },

    deleteTemplate: async (templateId: string): Promise<void> => {
        const response = await fetch(`${API_URL}/templates/${templateId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete template');
    },

    exportOrderTemplate: async (orderId: string, templateId: string, format = 'docx'): Promise<Blob> => {
        const response = await fetch(`${API_URL}/orders/${orderId}/export/template`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template_id: templateId, format }),
        });
        if (!response.ok) throw new Error('Failed to export order');
        return response.blob();
    },
};
