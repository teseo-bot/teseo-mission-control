# ADR-068: Orquestación Directa Odoo JSON-RPC y Pipeline Anti-Echo
**Fecha:** 28 Abril 2026
**Estado:** Implementado (Producción - Bloque 37)
**Proyecto:** crm-agentico-orchestrator

## 1. Contexto
El orquestador (`crm-agentico-orchestrator`) presentaba dos deficiencias críticas:
1.  **Falsa Sincronización:** Se utilizaba un mock (`syncCrmLeadTool`) que simulaba la inyección de leads sin conexión real al ERP.
2.  **Echo-Loops en Webhooks:** Al recibir mensajes en los endpoints de Meta/Telegram, si el grafo de LangGraph no generaba un mensaje nuevo de la IA (ej. terminaba por un proceso interno o error), el sistema repetía el mensaje del usuario de vuelta (fallback ciego). Además, los procesos de LangGraph sufrían timeouts en Cloud Run debido al CPU throttling.

## 2. Decisión Técnica
Se implementó un esquema **Zero-Trust Pipeline** para los canales de entrada:

- **Integración Directa Odoo:** Se habilitó `odooClient.ts` utilizando llamadas JSON-RPC puras. Se implementó lógica de *Upsert*: busca primero el lead por teléfono y, si existe, actualiza; si no, lo crea con nombre, empresa, pain points y el score estimado del agente.
- **Fire-and-Forget Asíncrono:** Los webhooks de Meta y Telegram devuelven HTTP 200 inmediatamente y delegan el procesamiento del grafo a una promesa asíncrona no bloqueante.
- **Validación Estricta de IA (Gatekeeper):** Antes de responder, el orquestador verifica explícitamente que la clase del último nodo en LangGraph corresponda a una IA (`_getType() === 'ai'` o constructor `AIMessage`). Si no lo es, o si la respuesta es idéntica a la entrada, se aborta la transmisión para evitar ecos.
- **Garantía de Cómputo:** Se forzó `run.googleapis.com/cpu-throttling: "false"` en `service.yaml` para asegurar que el entorno Gen2 de Cloud Run procese las promesas asíncronas de LangGraph en background.

## 3. Consecuencias
- Cese inmediato de los bucles infinitos en plataformas de mensajería.
- Los leads procesados impactan en tiempo real la base de datos de Odoo del tenant.
- Se elimina el bloqueo por timeouts de pasarela con Meta/Telegram.