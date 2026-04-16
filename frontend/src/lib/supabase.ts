
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:8000';

export const supabase = {
    from: (table: string) => {
        const builder = {
            select: (columns: string) => {
                const promise = (async () => {
                    try {
                        const response = await fetch(`${API_URL}/${table}`);
                        const data = await response.json();
                        return { data, error: null };
                    } catch (error) {
                        console.error('Fetch error:', error);
                        return { data: null, error };
                    }
                })();
                // Make it thenable to act like a promise
                (promise as any).then = promise.then.bind(promise);
                (promise as any).catch = promise.catch.bind(promise);
                return promise;
            },
            upsert: async (payload: any) => {
                try {
                    const response = await fetch(`${API_URL}/${table}/upsert`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    const data = await response.json();
                    return { data, error: response.ok ? null : { message: 'Failed to upsert' } };
                } catch (error) {
                    console.error('Upsert error:', error);
                    return { data: null, error };
                }
            },
        };
        return builder;
    },
    channel: () => ({
        on: () => ({
            subscribe: () => ({
                unsubscribe: () => { }
            })
        })
    })
} as any;
