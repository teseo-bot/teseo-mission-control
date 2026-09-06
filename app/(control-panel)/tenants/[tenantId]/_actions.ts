"use server";

import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { OperationFormValues, ClientFormValues, SuspensionFormValues } from "./schemas";
import { derivarEstadoDeServicio, planSuspension } from "@/lib/tenants/suspension";

// Esta consulta pedía CINCO columnas que no existen en el plano de control:
// telegram_bot_token, telegram_whitelisted_group_ids, suspension_status,
// suspension_reason y suspension_message. Las añade `migrations/001` y `002` — el
// directorio que NO corre nadie (el runner sólo aplica `migrations-gcp/`, con lista
// explícita). Ver la nota de las dos carpetas de migraciones.
//
// El efecto era doble y silencioso: el SELECT fallaba con 42703, el `catch` lo
// convertía en `null`, y el formulario se pintaba VACÍO para un tenant que sí tenía
// nombre y estado. Parecía «faltan datos por capturar» cuando era «la consulta no
// corre». Séptima vez del patrón en este programa.
export async function getTenantOperationSettings(tenantId: string) {
  try {
    const { rows } = await pool.query(
      `SELECT name, domain, orchestrator_url, status, billing_status,
              suspension_reason, suspension_message
         FROM tenants WHERE id = $1`,
      [tenantId]
    );
    if (rows.length === 0) {
      return null;
    }
    const tenant = rows[0];
    return {
      name: tenant.name || "",
      domain: tenant.domain || "",
      orchestratorUrl: tenant.orchestrator_url || "",
      telegramWhitelistedGroupIds: "",
      status: tenant.status === 'active',
      // El select del Kill Switch tiene CUATRO opciones y detrás hay DOS columnas, porque son
      // dos preguntas distintas: `status` dice si el servicio está cortado y `billing_status`
      // en qué punto de cobranza está. El corte gana al pintarlo — un tenant suspendido se lee
      // «Suspensión Total» aunque su cobranza estuviera al día, que es lo que el operador
      // necesita ver primero.
      suspensionStatus: derivarEstadoDeServicio(tenant.status, tenant.billing_status),
      suspensionReason: tenant.suspension_reason || "",
      suspensionMessage: tenant.suspension_message || "",
    };
  } catch (error: any) {
    // `null` aquí significa «no se pudo leer», y arriba se dibuja como formulario
    // vacío. Que el error quede en el log es lo único que distingue un tenant sin
    // datos de una consulta rota: no borrar este console.error.
    console.error("Error fetching tenant operation settings:", error);
    return null;
  }
}

export async function updateTenantOperationSettings(
  tenantId: string,
  values: OperationFormValues
) {
  try {
    const statusStr = values.status ? 'active' : 'suspended';
    
    // Vacío se guarda como NULL, no como ''. `tenants` tiene UNIQUE (domain): dos tenants
    // en aprovisionamiento con domain = '' chocarían entre sí y el segundo fallaría con un
    // 23505 que no dice nada del formulario. En Postgres los NULL no colisionan en un UNIQUE.
    // Además es lo que `invitations.ts` comprueba (`if (!domain)`) para caer al panel de control.
    const oNull = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);

    await pool.query(
      `UPDATE tenants 
       SET name = $1, domain = $2, orchestrator_url = $3, status = $4
       WHERE id = $5`,
      [
        values.name,
        oNull(values.domain),
        oNull(values.orchestratorUrl),
        statusStr,
        tenantId
      ]
    );
    revalidatePath(`/tenants/${tenantId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating tenant operation settings:", error);
    return { success: false, error: (error as Error).message };
  }
}

// El Kill Switch escribía `suspension_status`, `suspension_reason` y `suspension_message`, y
// ninguna de las tres existía: 42703 en cada guardado, medido contra el plano de control el
// 2026-09-02. Quien las definía era `migrations/002`+`004`, del directorio que no corre nadie.
// Las dos descriptivas las crea ahora `migrations-gcp/018`; la tercera se traduce a las columnas
// que ya mandaban.
//
// ⛔ EL CORTE NO TIENE COLUMNA PROPIA, Y ESO ES LA CORRECCIÓN. `tenants.status` ya existía, ya
// tenía su CHECK y ya lo escribe el toggle de la pestaña «Operación». Con una `suspension_status`
// aparte, las dos pestañas del MISMO formulario dirían «suspendido» en columnas distintas sin
// nada que defina cuál gana, y el orquestador tendría que desempatarlas con una regla no
// escrita. Aquí las dos escriben `status`, así que no pueden discrepar.
//
// `delayed` y `unpaid` NO cortan: son avisos de cobranza y el servicio sigue atendiendo.
export async function updateTenantSuspension(tenantId: string, values: SuspensionFormValues) {
  try {
    const { cortar, billing } = planSuspension(values.suspensionStatus);

    await pool.query(
      // ⚠️ `status` sólo se mueve entre 'active' y 'suspended'. Un tenant en 'onboarding' que se
      // reactive desde aquí seguiría en 'onboarding': el Kill Switch corta y descorta, no
      // adelanta el ciclo de vida del alta. Sin este CASE, abrir la pestaña y darle a Aplicar
      // graduaría de golpe a producción un tenant a medio aprovisionar.
      `UPDATE tenants
          SET status = CASE
                         WHEN $1::boolean THEN 'suspended'
                         WHEN status = 'suspended' THEN 'active'
                         ELSE status
                       END,
              billing_status     = COALESCE($2, billing_status),
              suspension_reason  = $3,
              suspension_message = $4,
              updated_at         = now()
        WHERE id = $5`,
      [
        cortar,
        billing,
        values.suspensionReason || null,
        values.suspensionMessage || null,
        tenantId,
      ]
    );
    revalidatePath(`/tenants/${tenantId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating tenant suspension:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getTenantClientSettings(tenantId: string) {
  try {
    const { rows } = await pool.query(
      `SELECT company_name, contact_name, email, phone, finops_token_ledger 
       FROM tenants 
       WHERE id = $1`, 
      [tenantId]
    );
    if (rows.length === 0) {
      return null;
    }
    const tenant = rows[0];
    return {
      companyName: tenant.company_name || "",
      contactName: tenant.contact_name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      monthlyTokenLimit: tenant.finops_token_ledger || 0,
    };
  } catch (error: any) {
    console.error("Error fetching tenant client settings:", error);
    return {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      monthlyTokenLimit: 0,
    };
  }
}

export async function updateTenantClientSettings(
  tenantId: string,
  values: ClientFormValues
) {
  try {
    await pool.query(
      `UPDATE tenants 
       SET company_name = $1, contact_name = $2, email = $3, phone = $4, finops_token_ledger = $5
       WHERE id = $6`,
      [
        values.companyName,
        values.contactName,
        values.email,
        values.phone,
        values.monthlyTokenLimit,
        tenantId
      ]
    );
    revalidatePath(`/tenants/${tenantId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating tenant client settings:", error);
    return { success: false, error: (error as Error).message };
  }
}
