import { useEffect, useState, useRef, useCallback } from 'react';

export interface SSEEvent {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: string;
}

export interface ProspectState {
  id: string;
  status: string;
  progress: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export function useProspectSSE(prospectId: string, tenantId: string, sessionToken: string) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [prospectState, setProspectState] = useState<ProspectState | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!prospectId || !tenantId || !sessionToken) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setConnectionStatus('connecting');

      const orchestratorUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:8000';
      const url = new URL(`${orchestratorUrl}/api/events/prospects/${prospectId}`);
      url.searchParams.append('tenant_id', tenantId);
      url.searchParams.append('token', sessionToken);

      const eventSource = new EventSource(url.toString(), { withCredentials: true });
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMounted) {
          eventSource.close();
          return;
        }
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };

      eventSource.onerror = (error) => {
        if (!isMounted) return;
        console.error('SSE Error:', error);
        setConnectionStatus('error');
        eventSource.close();
        
        const timeout = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
        reconnectAttempts.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connect();
        }, timeout);
      };

      const handleEvent = (type: string) => (e: MessageEvent) => {
        if (!isMounted) return;
        try {
          const parsedData = JSON.parse(e.data);
          
          setEvents(prev => [...prev, {
            type,
            data: parsedData,
            timestamp: new Date().toISOString()
          }]);

          setProspectState(prev => {
            const base = prev || { id: prospectId, status: 'unknown', progress: 0, data: {} };
            
            switch (type) {
              case 'agent.started':
                return { ...base, status: 'running', progress: 5 };
              case 'research.progress':
                return { ...base, status: 'running', progress: parsedData.progress || base.progress };
              case 'research.completed':
                return { ...base, status: 'completed', progress: 100, data: { ...base.data, ...parsedData.result } };
              case 'lead.updated':
                return { ...base, data: { ...base.data, ...parsedData.lead } };
              default:
                return base;
            }
          });
          
        } catch (err) {
          console.error('Error parsing SSE event data:', err);
        }
      };

      eventSource.addEventListener('agent.started', handleEvent('agent.started'));
      eventSource.addEventListener('research.progress', handleEvent('research.progress'));
      eventSource.addEventListener('research.completed', handleEvent('research.completed'));
      eventSource.addEventListener('lead.updated', handleEvent('lead.updated'));
    };

    connect();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [prospectId, tenantId, sessionToken]);

  const mutateProspect = useCallback((newData: Partial<ProspectState>) => {
    setProspectState(prev => prev ? { ...prev, ...newData } : null);
  }, []);

  return {
    connectionStatus,
    events,
    prospectState,
    mutateProspect
  };
}
