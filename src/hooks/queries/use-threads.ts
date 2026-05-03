import { useEffect, useState } from 'react';

export interface Lead {
  id: string;
  tenant_id: string;
  status?: string;
  created_at?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function useThreads(tenantId: string | undefined) {
  const [threads, setThreads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 1. Fetch initial state
  useEffect(() => {
    if (!tenantId) return;
    
    setLoading(true);
    
    const fetchInitial = async () => {
      try {
        // Asumimos que existirá un endpoint normal de lectura para inicializar
        const res = await fetch(`/api/inbox/initial?tenant_id=${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          setThreads(data.leads || []);
        } else if (res.status === 404) {
          // Si el endpoint no existe aún, silenciamos el error inicial
          setThreads([]);
        } else {
          throw new Error('Failed to fetch initial leads');
        }
      } catch (err) {
        console.error("Error fetching initial leads:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [tenantId]);

  // 2. Suscripción SSE (Server-Sent Events) para actualizaciones en tiempo real
  useEffect(() => {
    if (!tenantId) return;

    const eventSource = new EventSource(`/api/inbox?tenant_id=${tenantId}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'connected') return;

        // Formato esperado de pg_notify desde la BD (ej. Trigger de WAL)
        const { action, data: record } = payload;

        if (!record || !record.id) return;

        setThreads((prev) => {
          if (action === 'INSERT') {
            // Evitar duplicados
            if (prev.find(t => t.id === record.id)) return prev;
            return [record, ...prev];
          }
          if (action === 'UPDATE') {
            return prev.map(t => t.id === record.id ? { ...t, ...record } : t);
          }
          if (action === 'DELETE') {
            return prev.filter(t => t.id !== record.id);
          }
          return prev;
        });
      } catch (err) {
        console.error('Error parsing SSE message', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error connecting to /api/inbox:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [tenantId]);

  return { threads, setThreads, loading, error };
}
