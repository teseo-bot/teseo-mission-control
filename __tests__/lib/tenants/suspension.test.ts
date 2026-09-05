// __tests__/lib/tenants/suspension.test.ts
// El Kill Switch escribía tres columnas inexistentes y daba 42703 en cada guardado. Al
// repararlo, el corte se quedó en `tenants.status` —donde ya estaba— y sólo la cobranza y los
// dos textos estrenaron columna. Estos casos fijan la traducción entre el select de cuatro
// opciones y esas dos columnas, que es la única parte con reglas que se pueden equivocar.
//
// ⚠️ Registrado a mano en `test:node` (package.json). Los runners de este repo son listas
// explícitas: un *.test.ts fuera de ellas no lo corre nadie y la suite reporta verde.

import { describe, it } from "node:test";
import assert from "node:assert";
import {
  derivarEstadoDeServicio,
  planSuspension,
} from "../../../lib/tenants/suspension";

describe("derivarEstadoDeServicio — dos columnas, un select", () => {
  it("el corte gana a la cobranza: suspendido se lee suspendido aunque esté al día", () => {
    assert.equal(derivarEstadoDeServicio("suspended", "ok"), "suspended");
    assert.equal(derivarEstadoDeServicio("suspended", "unpaid"), "suspended");
  });

  it("sin corte, manda la cobranza", () => {
    assert.equal(derivarEstadoDeServicio("active", "delayed"), "delayed");
    assert.equal(derivarEstadoDeServicio("active", "unpaid"), "unpaid");
    assert.equal(derivarEstadoDeServicio("active", "ok"), "active");
  });

  it("un tenant en onboarding no se pinta como suspendido", () => {
    // `onboarding` es el tercer valor del CHECK de `tenants.status` y significa «todavía no
    // arranca», nunca «cortado». Pintarlo en rojo mandaría a buscar una suspensión que no existe.
    assert.equal(derivarEstadoDeServicio("onboarding", "ok"), "active");
  });

  it("aguanta una cobranza nula o desconocida sin inventarse un corte", () => {
    // La columna nace con DEFAULT 'ok', pero una fila leída antes de aplicar la 018 llega con
    // `undefined`. Eso NO puede pintarse como suspensión.
    assert.equal(derivarEstadoDeServicio("active", null), "active");
    assert.equal(derivarEstadoDeServicio("active", undefined), "active");
    assert.equal(derivarEstadoDeServicio("active", "cualquier_cosa"), "active");
  });
});

describe("planSuspension — un select, dos columnas", () => {
  it("sólo «Suspensión Total» corta", () => {
    assert.equal(planSuspension("suspended").cortar, true);
    assert.equal(planSuspension("active").cortar, false);
    assert.equal(planSuspension("delayed").cortar, false);
    assert.equal(planSuspension("unpaid").cortar, false);
  });

  it("suspender conserva la cobranza: el corte no borra su propia causa", () => {
    // `billing: null` es «no toques la columna». Forzar 'ok' aquí haría que cortar a un moroso
    // dejara la ficha diciendo que estaba al corriente.
    assert.equal(planSuspension("suspended").billing, null);
  });

  it("las dos alertas se escriben tal cual, y reactivar limpia la cobranza", () => {
    assert.equal(planSuspension("delayed").billing, "delayed");
    assert.equal(planSuspension("unpaid").billing, "unpaid");
    assert.equal(planSuspension("active").billing, "ok");
  });

  it("todo lo que devuelve billing cabe en el CHECK de la 018", () => {
    const admitidos = new Set(["ok", "delayed", "unpaid"]);
    for (const estado of ["active", "delayed", "unpaid", "suspended"] as const) {
      const { billing } = planSuspension(estado);
      if (billing !== null) {
        assert.ok(
          admitidos.has(billing),
          `planSuspension('${estado}') devuelve '${billing}', que el CHECK de tenants rechaza con 23514`
        );
      }
    }
  });
});
