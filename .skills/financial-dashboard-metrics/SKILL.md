---
name: financial-dashboard-metrics
description: "Use when specifying, implementing, reviewing, or testing financial metrics, date filters, alerts, category rankings, or B2B/B2C comparisons in this dashboard."
---

# Financial Dashboard Metrics

## Objetivo

Guiar cambios de métricas financieras sin inventar campos API, alterar unidades ni confundir etiquetas de UI con contratos. Esta skill es específica del dashboard React + TypeScript y su API FastAPI.

## Inputs requeridos

Antes de proponer un cambio, identifica:

1. El pedido/wording, período, segmento, agregación y unidades esperadas.
2. Endpoint y schema actuales en Swagger (`/docs` u `/openapi.json`). Si no están disponibles, verifica `backend/app/routes.py` y los modelos Pydantic.
3. Las specs `frontend/specs/README.md`, `components.md`, `api-types.ts` y `param-types.ts`.
4. Código y pruebas relevantes: `frontend/src/lib/financial-utils.ts`, `frontend/src/App.tsx`, `backend/tests/test_routes.py` y `frontend/src/lib/financial-utils.test.ts`.

Si una fuente no existe o no puede consultarse, indícalo; no presentes una inferencia como contrato verificado.

## Guía de trabajo

1. Separa el comportamiento implementado del comportamiento propuesto.
2. Traza cada nombre de campo y query param a OpenAPI o al modelo/endpoint backend. Conserva los nombres de transporte y los tipos de dominio existentes (`OperationType`, `Category`, `BusinessType`, `GroupBy`).
3. Para cada métrica, fija fórmula, unidad, redondeo, filtros y casos cero/vacío antes de codificar.
4. Alinea el wording de producto con la respuesta API. `Profit` no es campo de `FinancialMovement`; `MetricsSummaryItem` llama `net` al saldo.
5. Si el requerimiento contradice el algoritmo backend, explica la diferencia y limita el cambio a la capa autorizada. No modifiques API/backend sin permiso explícito.
6. Evita fórmulas duplicadas; actualiza specs, tipos y pruebas del slice modificado.

## Invariantes verificadas del repo

- `FinancialMovement`: `create_date`, `amount`, `operation_type`, `category`, `business_type`; tipos `income | outcome` y `B2B | B2C`.
- `start_date` y `end_date`: strings ISO `YYYY-MM-DD`, opcionales e inclusivos. El backend admite cada límite por separado; omite query params vacíos.
- `MetricsSummaryItem`: `period`, `income`, `outcome`, `net`; no contiene `profit` ni `profitPercent`.
- `MetricsAlert.increase_ratio` es un ratio decimal; para mostrar porcentaje, multiplícalo por 100. El backend emite alerta si la base previa es positiva y `increase_ratio > threshold`.
- `detect_outcome_alerts` promedia todos los períodos anteriores del resumen filtrado, no una ventana móvil fija de tres.
- `TopCategoryItem` contiene `category`, `operation_type`, `total_amount`; no devuelve `business_type`. El segmento se conoce por el parámetro de la consulta.
- El porcentaje del top-5 definido en la spec usa la suma de las filas top-5 recibidas. El gráfico de ingresos totales B2B/B2C suma `income` de `MetricsSummaryItem`; no sumes las filas top-5 para ese gráfico.
- `GET /api/metrics/facets` entrega `operation_types`, `business_types`, `categories`, `min_date`, `max_date`; no acepta filtros query.

## Output esperado

Entrega una guía o cambio accionable que incluya, según el pedido:

- Endpoints, params y tipos request/response con su fuente.
- Fórmula y unidad visible de cada indicador.
- Componentes/props o archivos afectados, distinguiendo DTOs API de view models UI.
- Estados límite: vacío, cero, rango parcial, error y validación.
- Pruebas y comandos pertinentes, con resultados realmente verificados.
- Contradicciones entre wording de producto y contrato, con una decisión explícita.

Si el pedido es solo de especificación, no implementes componentes, fetching ni backend.

## Criterios de aceptación

- Cada propiedad y query param coincide con OpenAPI o se etiqueta como view model propuesto.
- No se inventan campos: `business_type` de categorías procede del filtro request, no de `CategoryEntry`.
- Ratios y porcentajes no se mezclan; se especifican conversión y unidad.
- El baseline se describe según el algoritmo real, no como tres períodos cuando usa todos los previos.
- El top-5 y el total completo por segmento tienen denominadores explícitos.
- Filtros de fecha, inclusividad, defaults y restricciones quedan documentados y probados según el cambio.
- El cambio respeta la capa autorizada y no exagera resultados de lint, tests o build.