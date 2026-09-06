-- El Kill Switch del panel llevaba desde su primer día escribiendo en tres columnas que no
-- existen: `UPDATE tenants SET suspension_status, suspension_reason, suspension_message` daba
-- 42703 en cada guardado. Las definían `migrations/002` y `migrations/004` — el directorio que
-- NO corre nadie, porque el runner sólo aplica `migrations-gcp/` y con lista explícita.
--
-- ⛔ POR QUÉ NO SE REVIVEN LAS TRES COLUMNAS TAL CUAL, que era lo obvio.
--
-- `tenants.status` YA existe desde 001, ya tiene CHECK ('active','suspended','onboarding'), y ya
-- lo escribe el toggle de la pestaña «Operación» (`updateTenantOperationSettings`). Añadir
-- `suspension_status` deja DOS columnas que dicen «suspendido» en dos pestañas distintas del
-- mismo formulario, sin nada que defina cuál gana. El orquestador tendría que leer las dos y
-- desempatar con una regla que no está escrita en ningún sitio — y una regla que no está escrita
-- se implementa distinta en cada repo que la necesite.
--
-- Así que el corte se queda donde ya estaba y aquí sólo entra lo que no tenía dónde vivir:
--
--   · `status` (001)          → LA verdad del corte. Es la única columna que mira el orquestador.
--   · `billing_status`        → cobranza. `delayed` y `unpaid` son AVISOS: el servicio sigue
--                               atendiendo. Eje separado justo porque no corta; meterlos en el
--                               CHECK de `status` haría que `status <> 'active'` dejara de
--                               significar «cortado» para todo el que ya lo compara.
--   · `suspension_reason`     → nota interna del operador. No la ve el cliente.
--   · `suspension_message`    → lo que se le contesta al cliente cuando escribe estando cortado.
--
-- Las dos últimas DESCRIBEN, no deciden: apagar el servicio con `suspension_reason = 'algo'` y
-- `status = 'active'` no apaga nada, y eso es intencional.
--
-- ⚠️ `suspension_message` cruza a otro repo. `context-kdb-orchestrator` lo lee en el resolver de
-- canal y lo responde por el canal por el que escribió el cliente. Vaciarlo no reactiva el
-- servicio: hace que el bot calle en vez de explicar.
--
-- Idempotente: ADD COLUMN IF NOT EXISTS, y el CHECK se recrea porque `ADD CONSTRAINT` no admite
-- IF NOT EXISTS en Postgres — el DROP previo es lo que hace re-ejecutable este archivo.
-- Depende de: 001_control_base.sql (tenants). Aplicar tras 001..017.

BEGIN;

ALTER TABLE "public"."tenants"
    ADD COLUMN IF NOT EXISTS "billing_status"     "text" NOT NULL DEFAULT 'ok',
    ADD COLUMN IF NOT EXISTS "suspension_reason"  "text",
    ADD COLUMN IF NOT EXISTS "suspension_message" "text";

ALTER TABLE "public"."tenants" DROP CONSTRAINT IF EXISTS "tenants_billing_status_check";
ALTER TABLE "public"."tenants"
    ADD CONSTRAINT "tenants_billing_status_check"
    CHECK ("billing_status" IN ('ok', 'delayed', 'unpaid'));

COMMENT ON COLUMN "public"."tenants"."billing_status" IS
    'Cobranza: ok | delayed | unpaid. NO corta el servicio — el corte es tenants.status. Sólo lo pinta el panel.';
COMMENT ON COLUMN "public"."tenants"."suspension_reason" IS
    'Nota interna del operador sobre el corte. Nunca se le muestra al cliente.';
COMMENT ON COLUMN "public"."tenants"."suspension_message" IS
    'Lo que se le contesta al cliente que escribe con status=suspended. Lo lee el orquestador (inboxWorker) y lo pinta el panel del tenant. Vacío ⇒ el bot calla.';

COMMIT;
