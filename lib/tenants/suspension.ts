// El Kill Switch enseña UN select de cuatro opciones y detrás hay DOS columnas de `tenants`.
// Esta es la traducción entre ambos, aparte de la server action a propósito: es la única parte
// con reglas que se pueden equivocar, y en `_actions.ts` viviría junto al `pool` y no habría
// forma de probarla sin base de datos.
//
// Por qué dos columnas y no una `suspension_status` propia: `tenants.status` ya existía, ya
// tenía su CHECK y ya lo escribe el toggle de la pestaña «Operación». Una columna paralela
// dejaría dos pestañas del mismo formulario diciendo «suspendido» en sitios distintos sin nada
// que defina cuál gana. Ver `migrations-gcp/018_tenant_suspension.sql`.

/** Lo que el select del Kill Switch sabe pintar. */
export type EstadoDeServicio = 'active' | 'delayed' | 'unpaid' | 'suspended';

/**
 * Dos columnas → la opción del select.
 *
 * `status` gana: un tenant cortado se lee «Suspensión Total» aunque su cobranza esté al día.
 * El porqué del corte lo cuenta `suspension_reason`, no este valor.
 */
export function derivarEstadoDeServicio(
  status: string,
  billingStatus: string | null | undefined
): EstadoDeServicio {
  if (status === 'suspended') return 'suspended';
  if (billingStatus === 'delayed' || billingStatus === 'unpaid') return billingStatus;
  return 'active';
}

/** Qué escribir en cada columna. `billing === null` significa «no tocar la que ya está». */
export interface PlanDeSuspension {
  /** ¿Cortar el servicio? Es lo único que mira el orquestador. */
  cortar: boolean;
  /** Nuevo `billing_status`, o `null` para conservar el actual. */
  billing: 'ok' | 'delayed' | 'unpaid' | null;
}

/**
 * La opción del select → las dos columnas.
 *
 * Suspender NO toca la cobranza. Un tenant que se corta viniendo de `unpaid` conserva por qué
 * se cortó; si aquí se forzara un 'ok', el corte borraría su propia causa.
 */
export function planSuspension(estado: EstadoDeServicio): PlanDeSuspension {
  if (estado === 'suspended') return { cortar: true, billing: null };
  return { cortar: false, billing: estado === 'active' ? 'ok' : estado };
}
