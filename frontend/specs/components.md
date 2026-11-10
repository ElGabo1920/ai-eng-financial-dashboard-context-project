# Especificación de componentes del dashboard

## Estado y alcance

Este documento define el comportamiento esperado; **no implementa componentes ni cambia la API**. Los tipos referenciados están en [api-types.ts](api-types.ts), [param-types.ts](param-types.ts) y [financial-types.ts](../src/lib/financial-types.ts). Los nombres de campos y parámetros siguen el contrato de FastAPI descrito en [dashboard-metrics-api.md](dashboard-metrics-api.md).

El home actual solo hace `GET /api/metrics` y calcula gráficos en el cliente. La especificación siguiente amplía ese flujo para usar también el resumen agregado, alertas, facets y la comparación; no debe confundirse con comportamiento ya implementado.

## Tipos compartidos

- `DateRangeFilter`: `start_date?: string` y `end_date?: string`, fechas ISO `YYYY-MM-DD`; se omiten las claves vacías.
- `FacetsResponse`: valores disponibles y límites `min_date`/`max_date` de la referencia temporal.
- `AlertsParams` y `AlertsResponse`: parámetros de consulta y lista tipada de alertas.
- `TopCategoriesParams` y `TopCategoriesResponse`: filtro, límite y respuesta tipada de categorías.
- `BusinessType`, `OperationType`, `Category` y `MonthlyDataPoint`: tipos ya existentes en `financial-types.ts`.

No se debe agregar `business_type` a `CategoryEntry`: `/api/metrics/categories/top` no lo devuelve. El segmento se conoce por el parámetro usado en cada solicitud.

# Funcionalidad 1: Filtro de rango de fechas

## Componentes y layout

- **`DashboardDateRangeFilter`**: control compartido de inicio y fin, colocado en la parte superior del home, inmediatamente después del encabezado y antes de KPI/gráficos. En ancho amplio, inputs y texto de ayuda en una fila; en móvil, controles apilados.
- **`DashboardShell`**: dueño del estado común del filtro y de la carga de facets. Comparte el mismo valor del rango con home, alertas y ruta comparativa. No recibe props externas; es el contenedor raíz y mantiene el estado compartido.

Props propuestas:

```ts
interface DashboardDateRangeFilterProps {
  value: DateRangeFilter;
  facets: FacetsResponse | null;
  onChange: (value: DateRangeFilter) => void;
  error?: string | null;
}
```

Cada input es opcional, de tipo fecha, y su valor controlado se serializa como `YYYY-MM-DD`. El contrato del backend interpreta `start_date` y `end_date` como límites inclusivos.

## Carga de facets y ayuda

Al montar `DashboardShell`, cargar `GET /api/metrics/facets` una sola vez. Reutilizar la misma respuesta al navegar entre home y comparación; no volver a cargarla por cada edición del rango.

Cerca de los inputs, mostrar un texto de ayuda construido con `facets.min_date` y `facets.max_date`, por ejemplo: “Datos disponibles: <fecha mínima> – <fecha máxima>”. Presentarlo en formato legible para el locale de la interfaz, sin alterar los valores ISO que se envían a la API. Mientras carga facets, mostrar un estado de carga breve; si facets falla, mantener los inputs utilizables y no inventar límites.

## Rango parcial y llamadas API

El rango es abierto por cada lado, como ya permite `filter_movements_by_date` en el backend:

- Ambos campos vacíos: no serializar `start_date` ni `end_date`; mostrar el conjunto completo.
- Solo inicio: enviar únicamente `start_date`, sin límite superior.
- Solo fin: enviar únicamente `end_date`, sin límite inferior.
- Ambos rellenos y `start_date <= end_date`: enviar ambos.
- Si `start_date > end_date`: mostrar error junto al filtro y no emitir solicitudes con ese rango hasta corregirlo.

Construir query params con `URLSearchParams`, omitiendo strings vacíos. El mismo `DateRangeFilter` debe aplicarse a las solicitudes de métricas que alimentan el home:

1. `GET /api/metrics` para movimientos y KPI.
2. `GET /api/metrics/summary?group_by=month` para las series mensuales de ingresos/egresos y margen.
3. `GET /api/metrics/alerts` para anomalías (ver funcionalidad 2).

`GET /api/metrics/facets` se carga una vez y no recibe el filtro de fechas. Aunque el home actual aún calcula sus gráficos desde `/api/metrics`, esta spec establece `/api/metrics/summary` como fuente de agregados cuando se conecte el flujo nuevo.

# Funcionalidad 2: Tabla de alertas de anomalías

## Componentes y layout

- **`AlertsSection`**: bloque situado debajo de los dos gráficos del home; contiene control de threshold, acción para consultar y tabla/estados.
- **`AlertsTable`**: tabla de cuatro columnas, que recibe `AlertsResponse` y representa estados de carga, error, vacío y datos.

Props propuestas:

```ts
interface AlertsSectionProps {
  dateRange: DateRangeFilter;
  alerts: AlertsResponse;
  thresholdInput: string;
  isLoading: boolean;
  error?: string | null;
  onThresholdInputChange: (value: string) => void;
  onApply: () => void;
}

interface AlertsTableProps {
  alerts: AlertsResponse;
  isLoading: boolean;
  error?: string | null;
}
```

El estado de entrada se mantiene como `string` para permitir edición y validación antes de convertirlo a número. La consulta se envía al aplicar el valor válido. `AlertsParams` es el contrato de query; combinarlo con el rango compartido y usar `group_by=month` en el dashboard.

## Query y validación de threshold

Consultar `GET /api/metrics/alerts` con `threshold`, `group_by=month` y las fechas no vacías del `DateRangeFilter`. El backend acepta `threshold >= 0` y usa `0.3` por defecto; la UI de esta funcionalidad define un rango más estricto: `0.01` a `1.0`, valor inicial `0.3`, paso `0.01`.

Si el valor está vacío, no es numérico o queda fuera de `0.01..1.0`, **no hacer clamp**: mostrar un mensaje de validación junto al input y deshabilitar la acción de consultar. Enviar el valor como número solo después de validarlo. Esta regla evita modificar silenciosamente el umbral que introdujo el usuario.

## Columnas y semántica real de la respuesta

`AlertsResponse` es un arreglo de `AlertEntry`. Cada fila tiene cuatro campos:

| Encabezado | Campo API | Tipo | Presentación |
| :--- | :--- | :--- | :--- |
| Período | `period` | `string` | Periodo agrupado; con `group_by=month`, mostrar mes y año legibles. |
| Gasto del período | `outcome_total` | `number` | Importe monetario. |
| Media previa | `baseline_average` | `number` | Media de egresos de los períodos anteriores, como importe monetario. |
| Incremento | `increase_ratio` | `number` | Ratio decimal; mostrar como porcentaje multiplicando por 100 y añadiendo `%`. |

**Aclaración frente al wording de “media móvil de los tres períodos anteriores”:** la implementación actual de `detect_outcome_alerts` calcula la media de **todos los períodos anteriores** del resumen filtrado, no una ventana móvil de solo tres. La tabla debe titular esa columna “Media previa” o “Media histórica previa”; no debe afirmar “últimos tres períodos” hasta que el contrato/algoritmo del backend cambie.

El backend emite una alerta cuando la base previa es positiva y `increase_ratio > threshold` (estrictamente mayor). `increase_ratio` se devuelve redondeado a cuatro decimales; `outcome_total` y `baseline_average`, a dos.

## Estados vacíos y errores

Si `alerts.length === 0`, mostrar un estado vacío explícito en lugar de la tabla sin explicación:

- Título: **No se detectaron anomalías**
- Texto: **No hay períodos cuyo aumento de egresos supere el umbral seleccionado para este rango.**

Mantener estados de carga y error separados; no presentar un fallo de API como un resultado vacío.

# Funcionalidad 3: Vista comparativa B2B vs B2C

## Ruta y layout

- Ruta propuesta: **`/comparison`**, accesible desde navegación del dashboard.
- La página reutiliza el filtro compartido y los facets de `DashboardShell`.
- Desktop: dos paneles en columnas, B2B a la izquierda y B2C a la derecha; en pantallas estrechas, apilarlos en ese orden.
- Debajo de los paneles, un único gráfico de barras con los ingresos totales B2B y B2C.

El proyecto actualmente monta un único `App` y no tiene dependencia de routing en `package.json`. Para implementar `/comparison` más adelante, adoptar `react-router-dom` y declarar la ruta; esta decisión es parte del plan, no una dependencia añadida por esta spec.

## Componentes y props

- **`BusinessComparisonPage`**: coordina datos de ambas líneas, filtro y gráfico.

```ts
interface BusinessComparisonPageProps {
  dateRange: DateRangeFilter;
  facets: FacetsResponse;
  isLoading: boolean;
  error?: string | null;
}
```

- **`BusinessComparisonPanel`**: panel de una sola línea de negocio con título y tabla top-5.

```ts
interface BusinessComparisonPanelProps {
  businessType: BusinessType;
  entries: TopCategoriesResponse;
  isLoading: boolean;
  error?: string | null;
}
```

- **`TopCategoriesTable`**: tabla contenida en cada panel; puede compartir las props `entries` y `businessType` del panel. Usa `CategoryEntry` para las filas y etiqueta categorías con una presentación legible, preservando el valor API.

```ts
interface TopCategoriesTableProps {
  businessType: BusinessType;
  entries: TopCategoriesResponse;
}
```

- **`BusinessIncomeChart`**: gráfico comparativo agregado. Su view model es propio del frontend, no una respuesta API:

```ts
interface BusinessIncomePoint {
  businessType: BusinessType;
  totalIncome: number;
}

interface BusinessIncomeChartProps {
  data: BusinessIncomePoint[];
  isLoading: boolean;
  error?: string | null;
}
```

Usar `facets.business_types` como fuente de valores disponibles/validación; las dos líneas esperadas por el contrato son `B2B` y `B2C`. El rango disponible para ayuda usa `facets.min_date` y `facets.max_date`.

## Solicitudes y significado de las métricas

Para cada panel hacer una solicitud independiente a `GET /api/metrics/categories/top`:

- B2B: `operation_type=income`, `limit=5`, `business_type=B2B`.
- B2C: `operation_type=income`, `limit=5`, `business_type=B2C`.
- Añadir los límites de fecha no vacíos del `DateRangeFilter` a ambas.

Cada respuesta es `TopCategoriesResponse` (`CategoryEntry[]`) con `category`, `operation_type` y `total_amount`; no incluye `business_type`, porque se conoce por el filtro de la solicitud.

Columnas de cada tabla:

1. Categoría (`category`, mostrada con etiqueta legible).
2. Ingresos de la categoría (`total_amount`, moneda).
3. Porcentaje sobre el total **representado por las filas top-5 devueltas en ese panel**.

La API no devuelve ese porcentaje. Calcular en el frontend `total_amount / sum(entries.total_amount) * 100`. Si la suma es cero, mostrar `0%` sin dividir por cero. No describir este porcentaje como participación sobre todos los ingresos del segmento: las categorías fuera del top-5 no están incluidas en el denominador.

### Regla única para el gráfico comparativo

No sumar los `total_amount` de top-5: eso mediría solo las categorías mostradas y podría subestimar ingresos, además de producir una comparación distinta a “ingresos totales”. Obtener el total completo de cada segmento mediante `GET /api/metrics/summary` con `group_by=month`, `operation_type=income`, `business_type=B2B` o `B2C`, y el mismo filtro de fechas. En cada segmento, sumar `income` de todos los `MetricsSummaryItem` devueltos en el rango para formar un solo `BusinessIncomePoint`.

El gráfico tendrá exactamente dos puntos/barras: `B2B` y `B2C`; cada valor representa todos los ingresos del segmento en el rango, no el total del top-5. El punto de cada segmento es cero si la consulta no devuelve ingresos para ese rango.

## Paneles sin datos

Si una respuesta top-5 está vacía, solo ese panel muestra un estado vacío explícito:

- Título: **Sin categorías de ingresos**
- Texto: **No hay ingresos para este segmento y rango de fechas.**

El otro panel sigue mostrando su tabla si tiene resultados. El gráfico agregado se carga por separado y muestra el total del segmento (cero si no hay ingresos en el rango).

## Reglas de aceptación

- La carga de `/api/metrics/facets` ocurre una vez en el shell y su rango disponible aparece junto al filtro.
- Un inicio solo y un fin solo producen filtros abiertos válidos; ambos vacíos omiten ambos parámetros.
- Todos los endpoints de métricas consumidos por home, alertas y comparación reciben los mismos límites de fecha activos.
- El threshold inválido muestra error y bloquea la consulta, sin clamp.
- La tabla de alertas muestra cuatro columnas con unidades correctas y un estado vacío explícito.
- La columna de baseline no se rotula como media móvil de tres períodos mientras el backend use todos los períodos previos.
- Cada tabla de comparación muestra top-5 de `income`; el porcentaje usa únicamente la suma de esas filas.
- El gráfico comparativo agrega el total completo de `income` desde summary, con dos valores (B2B y B2C), sin sumar top-5.
