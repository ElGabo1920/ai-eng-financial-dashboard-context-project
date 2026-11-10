# Especificaciones del frontend

Este documento define las tres funcionalidades del dashboard y sus contratos. Los endpoints y parámetros indicados se contrastaron con Swagger (`/docs`) y OpenAPI (`/openapi.json`). La UI descrita es una especificación: no todo el flujo está implementado actualmente.

Documentos relacionados: [componentes y comportamiento](components.md), [tipos de respuesta](api-types.ts), [tipos de parámetros](param-types.ts) y [contratos y cálculos actuales](dashboard-metrics-api.md).

## Tipos compartidos

Los tipos de dominio `BusinessType`, `Category` y `OperationType` están en `src/lib/financial-types.ts`. Los tipos de request/response específicos de estas funcionalidades están en `api-types.ts` y `param-types.ts`.

```ts
interface DateRangeFilter {
	start_date?: string; // YYYY-MM-DD, inclusivo
	end_date?: string; // YYYY-MM-DD, inclusivo
}
```

`start_date` y `end_date` son opcionales. La UI omite cada clave si su input está vacío. El backend aplica cada límite de forma independiente e inclusiva; el criterio UI adicional es no enviar un rango invertido.

Valores de dominio aceptados por los filtros del API: `Category = "suppliers" | "sales" | "operational" | "administrative" | "others"`; `OperationType = "income" | "outcome"`; `BusinessType = "B2B" | "B2C"`; `GroupBy = "day" | "week" | "month"`. Las fechas deben ser strings calendario válidos con formato `YYYY-MM-DD`.

## Funcionalidad 1: Filtro de rango de fechas

### Endpoints y tipos

`DashboardShell` solicita `GET /api/metrics/facets` una sola vez, sin query params, y comparte `FacetsResponse` entre home y comparación. La respuesta tiene `operation_types: OperationType[]`, `business_types: BusinessType[]`, `categories: Category[]`, `min_date: string` y `max_date: string`; ambas fechas son ISO `YYYY-MM-DD`.

Los datos filtrados se obtienen mediante:

| Endpoint | Request TypeScript | Response TypeScript | Uso |
| :--- | :--- | :--- | :--- |
| `GET /api/metrics` | `DateRangeFilter` | `FinancialMovement[]` (`src/lib/financial-types.ts`) | Movimientos para KPI. |
| `GET /api/metrics/summary` | `SummaryParams` | `SummaryResponse` (definidos abajo como tipos de esta spec) | Agregados mensuales de ingresos/egresos y margen. |
| `GET /api/metrics/alerts` | `AlertsParams` | `AlertsResponse` (`api-types.ts`) | Alertas del home; detalle en Funcionalidad 2. |

`GET /api/metrics` acepta además `category` (`suppliers | sales | operational | administrative | others`) y `operation_type` (`income | outcome`), ambos opcionales. `GET /api/metrics/summary` acepta `group_by` (`day | week | month`, default `month`), `category` (mismos cinco valores), `operation_type` (`income | outcome`) y `business_type` (`B2B | B2C`), además del rango; todos esos parámetros son opcionales. La pantalla usa `group_by=month` para sus series. `GET /api/metrics/facets` no recibe rango ni query params.

El esquema de resumen contiene `period: string`, `income: number`, `outcome: number` y `net: number`:

```ts
interface SummaryParams extends DateRangeFilter {
	group_by?: GroupBy;
	category?: Category;
	operation_type?: OperationType;
	business_type?: BusinessType;
}

interface SummaryEntry {
	period: string;
	income: number;
	outcome: number;
	net: number;
}

type SummaryResponse = SummaryEntry[];
```

`SummaryParams` y `SummaryResponse` son tipos propuestos para completar el contrato frontend; todavía no están exportados por los archivos TypeScript existentes.

### UI y casos límite

Colocar dos controles de fecha (inicio y fin) en la parte superior del home, inmediatamente después del encabezado. Junto a ellos mostrar `min_date`–`max_date` de facets en formato legible para el usuario; mantener ISO para el query. Cargar facets una vez en el shell y reutilizar el resultado al navegar.

| Caso límite | Query/comportamiento | Qué muestra la UI |
| :--- | :--- | :--- |
| Ambos inputs vacíos | Omitir `start_date` y `end_date` de todas las solicitudes; cargar el conjunto completo. | Sin error de rango; muestra KPI y series sin filtrar. |
| Solo inicio o solo fin | Enviar solo el límite presente; el otro lado queda abierto. | Mantiene ambos controles editables y muestra los resultados desde/hasta ese límite. |
| Inicio posterior al fin | No emitir solicitudes con ese rango. | Error junto a los inputs indicando que inicio no puede superar fin. |
| Facets falla | No inventar rango ni bloquear el filtro manual. | Inputs siguen utilizables; se oculta la pista de rango y se presenta un aviso no bloqueante. |

## Funcionalidad 2: Tabla de alertas de anomalías

### Endpoint y tipos

Consultar `GET /api/metrics/alerts`. El request usa `AlertsParams` de `param-types.ts`; la respuesta `AlertsResponse` de `api-types.ts` es `AlertEntry[]` con:

| Propiedad | Tipo | Significado |
| :--- | :--- | :--- |
| `period` | `string` | Periodo alertado; con `group_by=month`, presentar mes y año. |
| `outcome_total` | `number` | Egreso total del periodo, redondeado a dos decimales. |
| `baseline_average` | `number` | Media de egresos de períodos previos, redondeada a dos decimales. |
| `increase_ratio` | `number` | Ratio relativo de aumento, redondeado a cuatro decimales. |

`AlertsParams` incluye `threshold?: number`, `group_by?: GroupBy`, `business_type?: BusinessType` y el `DateRangeFilter` compartido. Restricciones OpenAPI: threshold `>= 0`, default `0.3`; `group_by` es `day | week | month`, default `month`; `business_type` es `B2B | B2C`. La UI restringe el input a `0.01..1.0`, default `0.3`, y envía `group_by=month` junto con las fechas no vacías.

### UI y casos límite

Renderizar `AlertsSection` bajo los gráficos del home y `AlertsTable` con las columnas período, gasto del período, media previa e incremento porcentual. Convertir `increase_ratio` a porcentaje visual multiplicando por 100; el contrato lo entrega como ratio.

La implementación actual del backend calcula la media de **todos los períodos anteriores** dentro del resumen filtrado, no una ventana de tres. No rotularla “media móvil de los tres períodos anteriores” hasta que cambie el backend; usar “Media previa”. Una alerta se devuelve cuando la base previa es positiva y `increase_ratio > threshold` (estricto).

| Caso límite | Qué muestra la UI |
| :--- | :--- |
| Threshold vacío, no numérico o fuera de `0.01..1.0` | Mensaje de validación; deshabilita consultar y no hace request. No hace clamp. |
| `AlertsResponse` es `[]` | Estado vacío explícito con título **No se detectaron anomalías** y texto que indique que ningún período superó el umbral. No deja una tabla vacía sin explicación. |
| Solo hay un período filtrado o no existe baseline positivo | La API no genera alertas; mostrar el mismo estado vacío, no un error. |
| El aumento es igual al threshold | La condición del backend es `>`; no aparece esa alerta y la UI mantiene el estado vacío si no hay otras. |

## Funcionalidad 3: Comparativa B2B vs. B2C

### Endpoints y tipos

La ruta UI propuesta es `/comparison`; el proyecto aún no tiene router configurado. En esa página, solicitar una vez por segmento `GET /api/metrics/categories/top` con:

```ts
const b2bParams: TopCategoriesParams = {
	operation_type: "income",
	limit: 5,
	business_type: "B2B",
	// Añadir start_date/end_date solo si existen.
};
```

Para B2C se usa el mismo objeto con `business_type: "B2C"`. `TopCategoriesParams` incluye el rango opcional; parámetros OpenAPI: `operation_type` (`income | outcome`, default `outcome`), `limit` entero de `1..20` (default `5`), fechas y `business_type` (`B2B | B2C`), todos salvo defaults opcionales.

Cada respuesta es `TopCategoriesResponse` (`CategoryEntry[]` en `api-types.ts`) con `category: Category`, `operation_type: OperationType` y `total_amount: number`. No incluye `business_type`; el panel se identifica por el filtro enviado. `FacetsResponse.business_types` y `.categories` aportan valores disponibles para mostrar/validar.

Para el gráfico total, por cada segmento consultar `GET /api/metrics/summary` con `group_by=month`, `operation_type=income`, `business_type=B2B|B2C` y el mismo `DateRangeFilter`. La respuesta es `SummaryResponse` (`SummaryEntry[]`); sumar `income` de **todos** los periodos del rango para producir un dato por segmento. No sumar el top-5: el gráfico debe representar ingresos completos.

### UI y casos límite

La vista contiene dos paneles (B2B y B2C), cada uno con tabla top-5, y un único gráfico comparativo debajo. Columnas de tabla: categoría (`category`), ingresos por categoría (`total_amount`) y porcentaje del panel. Como la API no devuelve porcentaje, calcular `total_amount / sum(total_amount de las filas top-5 del panel) * 100`; el denominador se limita explícitamente a las filas recibidas.

| Caso límite | Qué muestra la UI |
| :--- | :--- |
| Top-5 B2B vacío y B2C con datos (o viceversa) | Solo el panel vacío muestra título **Sin categorías de ingresos** y mensaje de ausencia para ese segmento/rango. El panel con datos permanece normal. El gráfico sigue mostrando dos barras, con `0` para el segmento sin ingresos. |
| Suma de `total_amount` top-5 es cero | Porcentaje de cada fila en `0%`; no divide por cero. |
| Resumen no devuelve ingresos para un segmento/rango | La barra de ese segmento representa `0`; la otra barra conserva su total. |
| Filtro de fechas vacío | Se omiten ambas fechas tanto en las dos solicitudes top como en las dos solicitudes summary; ambas consultas abarcan todos los datos disponibles. |

## Notas de implementación

- Compartir el estado `DateRangeFilter` y el resultado de facets entre home y comparación; no volver a pedir facets al editar fechas.
- Serializar query params con `URLSearchParams`, omitiendo valores vacíos y conservando los nombres snake_case requeridos por FastAPI.
- Los estados de error de red no deben presentarse como arrays vacíos.
- Mantener separados los tipos reales de respuesta (`api-types.ts`) de view models de UI (por ejemplo, `BusinessIncomePoint`).
- El home actual solo consume `GET /api/metrics`; las solicitudes summary, alerts, facets y comparison aquí descritas son el flujo especificado, no una afirmación de que ya esté implementado.
