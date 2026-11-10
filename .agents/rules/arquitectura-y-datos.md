# Regla: Arquitectura y Datos Financieros

## Alcance
Cambios en `backend/app/`, `frontend/src/App.tsx`, `frontend/src/lib/financial-utils.ts` y componentes que muestran periodo o métricas.

## Justificación
`App.tsx` obtiene movimientos de `/api/metrics` y calcula KPI y agregados mensuales mediante `financial-utils.ts`, mientras `backend/app/routes.py` también ofrece endpoints de resumen. Además, el encabezado fija `2024 - Full Year`, pero las fechas del backend dependen de `date.today()`. La generación con semilla usa `random.seed()`, que modifica el estado global del generador.

## Guía específica del proyecto
- Antes de añadir o cambiar un cálculo, establece si su fuente de verdad será el backend o el frontend. Evita mantener fórmulas equivalentes en ambos lados sin una necesidad explícita.
- Deriva el periodo mostrado de las fechas devueltas por la API; no agregues años o periodos estáticos que puedan contradecir los datos.
- Al generar datos deterministas, prefiere una instancia local `random.Random(seed)` por llamada en lugar de `random.seed(seed)` sobre el estado global.
- Conserva las propiedades actuales de los datos generados —360 movimientos ordenados, 30 por cada uno de 12 meses— salvo que el cambio actualice también los consumidores y pruebas pertinentes.
