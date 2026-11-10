# Memoria del Proyecto: Panel de Métricas Financieras

Esta memoria resume el producto y el estado del repositorio a partir de archivos y comportamientos verificables. Las prioridades al final son recomendaciones de mantenimiento derivadas de los gaps observados, no un roadmap de producto aprobado.

## Overview del producto

El README describe el proyecto como un dashboard de métricas financieras con frontend React + TypeScript y backend FastAPI ([README.es.md](../README.es.md)). La pantalla actual presenta KPI de ingresos, egresos, ganancia y porcentaje de ganancia, además de gráficos mensuales ([App.tsx](../frontend/src/App.tsx), [financial-utils.ts](../frontend/src/lib/financial-utils.ts), componentes en `frontend/src/components/dashboard/`).

El backend proporciona movimientos financieros de ejemplo generados en memoria, no persistencia de negocio. Define endpoints de movimientos, facetas, resúmenes por periodo, categorías principales, comparaciones, alertas y filtros B2B/B2C ([routes.py](../backend/app/routes.py)). La UI principal actualmente solicita `GET /api/metrics`; no consume desde `App.tsx` los demás endpoints analíticos.

No se infieren usuarios objetivo, casos de uso empresariales, integraciones externas, requisitos de producción ni funcionalidades futuras: el repositorio no los documenta.

## Stack tecnológico

### Lenguajes y frameworks

- **Frontend:** TypeScript y React 19, con Vite 8 como servidor de desarrollo y build; Tailwind CSS 4 para estilos ([package.json](../frontend/package.json), [vite.config.ts](../frontend/vite.config.ts)).
- **Backend:** Python 3.13 y FastAPI; Uvicorn sirve la API y Pydantic modela las respuestas ([requirements.txt](../backend/requirements.txt), [main.py](../backend/app/main.py), [routes.py](../backend/app/routes.py)).

### Dependencias clave

- **Frontend runtime:** `react`, `react-dom`, `recharts` para gráficos, `lucide-react` para iconos, `class-variance-authority`, `clsx` y `tailwind-merge` para composición de clases.
- **Frontend tooling:** TypeScript, Vite, `@vitejs/plugin-react`, `@tailwindcss/vite`, ESLint y Vitest; los scripts están en [package.json](../frontend/package.json).
- **Backend runtime y pruebas:** `fastapi`, `uvicorn[standard]`, `debugpy`, `pytest`, `pytest-cov` y `httpx`, listados en [requirements.txt](../backend/requirements.txt).

### Infraestructura y ejecución

- [docker-compose.yml](../docker-compose.yml) define `frontend` y `backend`; no define base de datos ni otro servicio de persistencia.
- El frontend publica el puerto `5173`; el backend publica `8000` para HTTP y `5678` para debugpy.
- Los contenedores usan Node 24 Alpine para el frontend y Python 3.13 slim para el backend ([Dockerfile](../frontend/Dockerfile), [Dockerfile](../backend/Dockerfile)).
- [vite.config.ts](../frontend/vite.config.ts) proxya `/api` a `http://backend:8000`, nombre de servicio de la red Compose.
- Instrucción documentada de arranque: `docker compose up --build` ([README.es.md](../README.es.md)).

## Estado actual

### Comprobado en el repositorio

- La API implementa `/health` y endpoints bajo `/api/metrics`, incluidos `/facets`, `/summary`, `/categories/top`, `/comparison`, `/alerts`, `/b2b` y `/b2c` ([routes.py](../backend/app/routes.py)).
- El generador produce 360 movimientos de ejemplo, 30 por cada uno de 12 meses, y cada endpoint lo invoca con `seed=42`; los años dependen de la fecha actual ([routes.py](../backend/app/routes.py)).
- La pantalla principal solicita `/api/metrics` y calcula sus KPI y agregados mensuales en el frontend ([App.tsx](../frontend/src/App.tsx)).
- Hay pruebas backend para generación y endpoints ([test_routes.py](../backend/tests/test_routes.py)) y pruebas frontend de cálculos y formateadores ([financial-utils.test.ts](../frontend/src/lib/financial-utils.test.ts)).
- `verification.md` registra que se consultaron diez URLs de backend/frontend y que todas respondieron HTTP 200. Las respuestas largas solo se inspeccionaron parcialmente; las suites automatizadas `pytest` y `npm test` no se ejecutaron en esa verificación ([verification.md](../verification.md)).

### Gaps conocidos en el estado observado

- El encabezado de la UI fija `2024 - Full Year`, aunque el backend genera fechas relativas a `date.today()`; el periodo mostrado puede no coincidir con los gráficos ([App.tsx](../frontend/src/App.tsx), [routes.py](../backend/app/routes.py)).
- El proxy de Vite apunta al hostname `backend`, adecuado para Compose pero no necesariamente resoluble al ejecutar Vite directamente en el host ([vite.config.ts](../frontend/vite.config.ts)).
- README menciona copiar `frontend/.env.example`, pero no se encontró ese archivo en el árbol revisado ([README.es.md](../README.es.md)).
- Compose usa `depends_on`, pero no configura healthcheck ni readiness para la API ([docker-compose.yml](../docker-compose.yml)).
- El backend usa `random.seed(seed)`, que cambia el estado global del generador pseudoaleatorio ([routes.py](../backend/app/routes.py)).
- CORS permite cualquier origen y habilita credenciales; conviene revisar esa política antes de incorporar autenticación o desplegar públicamente ([main.py](../backend/app/main.py)).
- La UI calcula KPI/agregados en el cliente y el backend también expone análisis; no hay una decisión documentada sobre la fuente de verdad para esas métricas ([App.tsx](../frontend/src/App.tsx), [routes.py](../backend/app/routes.py)).
- No se registró ejecución automatizada reciente de las suites en `verification.md`; tener pruebas en el repo no significa que estén pasando en el entorno actual.

## Prioridades técnicas sugeridas

Estas prioridades se derivan de los gaps anteriores y no implican compromisos de producto:

1. Hacer que el periodo del encabezado refleje las fechas realmente mostradas.
2. Aclarar y corregir las instrucciones de configuración local: añadir el `.env.example` referido o quitar esa referencia, y distinguir ejecución con Compose de ejecución directa.
3. Elegir una fuente de verdad para los cálculos compartidos y mantener sincronizados los contratos Python/TypeScript.
4. Aislar el generador pseudoaleatorio por llamada para evitar estado global compartido.
5. Ejecutar y registrar `pytest`, `npm test`, `npm run lint` y `npm run build` según la capa modificada; añadir healthcheck a Compose si se requiere comprobar disponibilidad antes de arrancar la UI.
6. Restringir CORS antes de cualquier despliegue expuesto o incorporación de autenticación.

## Convenciones para agentes

- Revisar `AGENTS.md` y las reglas de `.agents/rules/` antes de modificar el proyecto.
- Mantener sincronizados los modelos Pydantic y los tipos TypeScript al cambiar contratos.
- Al cambiar rutas, probar estado HTTP y contenido; al cambiar cálculos frontend, actualizar sus pruebas Vitest.
- Distinguir resultados de `curl` de resultados de suites automatizadas y no afirmar verificaciones que no se ejecutaron.
