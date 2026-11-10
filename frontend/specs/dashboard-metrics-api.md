# Especificación: API de las métricas del dashboard

## Fuente y alcance

El contrato se consultó en Swagger UI (`http://localhost:8000/docs`) y en el OpenAPI servido por `/openapi.json`. Las tres áreas mapeadas son las que renderiza actualmente `App.tsx`: fila de KPI, gráfico de ingresos vs. egresos y gráfico de margen porcentual.

## Resumen del consumo actual

La UI hace **una sola solicitud** al cargar: `GET /api/metrics`, sin parámetros de query. `App.tsx` distribuye el mismo arreglo a las tres funcionalidades; el frontend calcula las agregaciones en `financial-utils.ts`.

| Funcionalidad | Endpoint usado ahora | Cálculo en frontend | Forma de datos que recibe el componente |
| :--- | :--- | :--- | :--- |
| KPI | `GET /api/metrics` | Suma `amount` para `income` y `outcome`; calcula `profit = income - outcome` y `profitPercent = profit / income * 100` (o `0` si no hay ingresos). | Totales `totalIncome`, `totalOutcome`, `profit`, `profitPercent`. |
| Ingresos vs. egresos | `GET /api/metrics` | Agrupa movimientos por año-mes y suma ingresos y egresos de cada mes. | Arreglo `{ month, income, outcome, profitPercent }[]`; el gráfico usa `month`, `income` y `outcome`. |
| Margen porcentual | `GET /api/metrics` | Reutiliza el agregado mensual y calcula `(income - outcome) / income * 100` (o `0` si no hay ingresos). | Arreglo `{ month, income, outcome, profitPercent }[]`; el gráfico usa `month` y `profitPercent`. |

Estas formas de datos son estructuras calculadas en el frontend, no respuestas independientes de la API. Referencias de implementación: [App.tsx](../src/App.tsx) y [financial-utils.ts](../src/lib/financial-utils.ts).

## Patrón de fetch observado

La búsqueda del frontend encontró una sola llamada HTTP: `fetchFinancialData()` en [App.tsx](../src/App.tsx). Lee `VITE_API_BASE_URL` (vacío por defecto), solicita `${API_BASE_URL}/api/metrics`, comprueba `response.ok` antes de llamar `response.json()` y propaga un error si el estado no es exitoso. El componente captura el error, muestra un mensaje genérico y termina el estado de carga.

No hay un cliente HTTP compartido ni wrapper de API en `frontend/src/`. Para mantener consistencia, las nuevas llamadas deberían seguir este manejo de URL, estado HTTP y JSON; si se extrae un cliente común, actualizar esta especificación para reflejarlo.

## Alineación entre wording visible y contrato API

No se encontró un documento de producto separado con definiciones de métricas. La siguiente reconciliación usa las etiquetas actuales de la UI y las compara con los nombres publicados por OpenAPI; las etiquetas no deben confundirse con propiedades existentes en las respuestas.

| Wording visible | Dato real del endpoint / cálculo | Resolución en esta especificación |
| :--- | :--- | :--- |
| `Total Income` | En `FinancialMovement`, no existe `totalIncome`: se suma `amount` para movimientos cuyo `operation_type` es `income`. | Tratar como KPI calculado por el cliente, no como campo de API. |
| `Total Outcome` | No existe `totalOutcome`: se suma `amount` donde `operation_type` es `outcome`. `outcome` también es el nombre del total por periodo en `MetricsSummaryItem`. | Diferenciar el discriminador `operation_type` del agregado `outcome`. |
| `Profit` | No hay un campo `profit` en `FinancialMovement`. El cliente calcula `totalIncome - totalOutcome`; `MetricsSummaryItem` expresa ese neto como `net`. | Mapear `Profit` a la diferencia calculada en el cliente o a `net` si se consume el resumen backend. |
| `Profit Margin` / `Profit Margin %` | No hay campo ni endpoint de margen en OpenAPI. El frontend expone `profitPercent`, calculado como `(income - outcome) / income * 100`, con resultado `0` cuando no hay ingresos. | Tratar `profitPercent` como dato derivado del frontend; no presentarlo como campo de respuesta. |
| `Income vs. Outcome` | El contrato de movimientos usa `amount` + `operation_type`; el contrato de resumen usa `income` y `outcome`. | La UI actual agrupa movimientos; el endpoint de resumen podría entregar esos totales, pero no es el consumo actual. |

El endpoint `/api/metrics/summary` devuelve `net`, no `profit` ni `profitPercent`. Si se adopta para gráficos, el margen debe derivarse con una regla explícita para ingreso cero. No se cambia la implementación como parte de esta especificación.

## Endpoint actual: movimientos financieros

### `GET /api/metrics`

La respuesta exitosa definida por OpenAPI es un arreglo de `FinancialMovement`:

```json
[
  {
    "create_date": "2026-01-08",
    "amount": 1250.5,
    "operation_type": "income",
    "category": "sales",
    "business_type": "B2B"
  }
]
```

Cada objeto incluye:

| Campo | Tipo | Valores/forma |
| :--- | :--- | :--- |
| `create_date` | string | Fecha ISO (`YYYY-MM-DD`). |
| `amount` | number | Importe del movimiento. |
| `operation_type` | string | `income` o `outcome`. |
| `category` | string | `suppliers`, `sales`, `operational`, `administrative` u `others`. |
| `business_type` | string | `B2B` o `B2C`. |

### Parámetros de query

Todos son opcionales; la UI actual no envía ninguno.

| Parámetro | Tipo/valores | Efecto |
| :--- | :--- | :--- |
| `start_date` | Fecha `YYYY-MM-DD` | Límite inferior del periodo. |
| `end_date` | Fecha `YYYY-MM-DD` | Límite superior del periodo. |
| `category` | `suppliers`, `sales`, `operational`, `administrative`, `others` | Filtra por categoría. |
| `operation_type` | `income`, `outcome` | Filtra por tipo de movimiento. |

Los parámetros permiten filtrar el mismo conjunto antes de calcular los tres módulos, si la UI incorpora filtros. No existe actualmente un parámetro `business_type` en este endpoint.

## Alternativa disponible para gráficos: resumen backend

### `GET /api/metrics/summary`

La respuesta exitosa es un arreglo de `MetricsSummaryItem`:

```json
[
  {
    "period": "2026-01",
    "income": 12500.0,
    "outcome": 8400.0,
    "net": 4100.0
  }
]
```

Los campos son `period` (string), `income` (number), `outcome` (number) y `net` (number). El endpoint **no** devuelve `profitPercent`; ese valor se deriva como `net / income * 100`, con manejo de ingreso cero.

### Parámetros de query

| Parámetro | Tipo/valores | Requerido/default | Efecto |
| :--- | :--- | :--- | :--- |
| `group_by` | `day`, `week`, `month` | Opcional; default `month` | Agrupación del periodo. |
| `start_date` | Fecha `YYYY-MM-DD` | Opcional | Límite inferior del periodo. |
| `end_date` | Fecha `YYYY-MM-DD` | Opcional | Límite superior del periodo. |
| `category` | `suppliers`, `sales`, `operational`, `administrative`, `others` | Opcional | Filtra por categoría. |
| `operation_type` | `income`, `outcome` | Opcional | Filtra por tipo de movimiento. |
| `business_type` | `B2B`, `B2C` | Opcional | Filtra por tipo de negocio. |

`App.tsx` no consume actualmente este endpoint. Puede servir para trasladar agregaciones mensuales al backend, pero adoptarlo requiere actualizar el cliente y sus pruebas; no es el comportamiento actual.

## Contrato y pruebas relacionadas

Al cambiar los modelos backend, sincroniza sus tipos en [financial-types.ts](../src/lib/financial-types.ts). Los cálculos de KPI y series tienen pruebas en [financial-utils.test.ts](../src/lib/financial-utils.test.ts). Las pruebas de los endpoints están en [test_routes.py](../../backend/tests/test_routes.py).
