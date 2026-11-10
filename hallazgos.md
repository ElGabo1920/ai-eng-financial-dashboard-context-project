# Reglas Propuestas para Contribuidores y Agentes

Estos hallazgos se proponen a partir de comportamientos y archivos presentes en el repositorio. No reemplazan las instrucciones de `AGENTS.md` ni se consideran reglas activas hasta que el equipo las adopte.

## Arquitectura y datos

1. **Mantén una sola fuente de verdad para cada cálculo financiero.** Antes de implementar un KPI o agregado, decide si lo calcula el backend o el frontend y evita duplicar la fórmula. Actualmente [App.tsx](frontend/src/App.tsx) calcula KPI y agregados mensuales con [financial-utils.ts](frontend/src/lib/financial-utils.ts), mientras [routes.py](backend/app/routes.py) también expone resúmenes analíticos.

2. **Deriva el periodo mostrado de las fechas de los datos.** No fijes el periodo del dashboard como literal: [App.tsx](frontend/src/App.tsx) muestra `2024 - Full Year`, pero [routes.py](backend/app/routes.py) genera fechas relativas a `date.today()`.

3. **Usa un generador pseudoaleatorio local al producir datos con semilla.** Evita `random.seed()` sobre el estado global: `generate_mock_movements()` en [routes.py](backend/app/routes.py) lo invoca con `seed=42` desde los endpoints, lo que modifica el generador compartido. Prefiere una instancia `random.Random(seed)` por generación para reducir interferencias entre solicitudes concurrentes.

## Contratos y naming

4. **Sincroniza los contratos de datos entre Python y TypeScript.** Los valores válidos de tipos, categorías y negocio están definidos en [routes.py](backend/app/routes.py) y también en [financial-types.ts](frontend/src/lib/financial-types.ts). Al cambiar un campo o valor, actualiza ambos lados y sus pruebas.

5. **Usa nombres de campo y valores de dominio coherentes con el contrato existente.** El modelo `FinancialMovement` expone, por ejemplo, `create_date`, `operation_type` y `business_type`; conserva esos nombres en endpoints, tipos y pruebas salvo que el cambio incluya una migración coordinada del contrato ([routes.py](backend/app/routes.py), [financial-types.ts](frontend/src/lib/financial-types.ts)).

## Testing

6. **Prueba los filtros y el contrato de cada endpoint que modifiques.** Las pruebas en [test_routes.py](backend/tests/test_routes.py) comprueban códigos HTTP, campos de respuesta, filtrado y orden cronológico; sigue ese patrón al añadir o cambiar rutas.

7. **Acompaña los cambios de cálculos del frontend con pruebas de funciones.** Los cálculos y formateadores tienen pruebas Vitest en [financial-utils.test.ts](frontend/src/lib/financial-utils.test.ts). Ejecuta `npm test` cuando cambies esa lógica.

8. **No declares una suite verificada si no se ejecutó.** El frontend define `npm test`, `npm run lint` y `npm run build` en [package.json](frontend/package.json), y el backend incluye pruebas en [test_routes.py](backend/tests/test_routes.py). Registra por separado comprobaciones manuales como `curl` y ejecuciones automatizadas como `pytest` o `npm test`.

## Documentación y experiencia de desarrollo

9. **Documenta por separado la ejecución con Docker Compose y la ejecución local de Vite.** El proxy de [vite.config.ts](frontend/vite.config.ts) apunta a `http://backend:8000`, hostname disponible dentro de la red de Compose definida en [docker-compose.yml](docker-compose.yml). Para desarrollo fuera de Compose, documenta cómo configurar un backend alcanzable desde el host.

10. **Mantén sincronizados los pasos de configuración con los archivos existentes.** [README.es.md](README.es.md) indica copiar `frontend/.env.example`, pero ese archivo no está presente actualmente. Si se conserva esa instrucción, añade el archivo de ejemplo; si no, reemplázala por los pasos de configuración vigentes.

11. **Documenta los puertos y las condiciones de disponibilidad de los servicios.** Compose publica los puertos 5173, 8000 y 5678, y `frontend` usa `depends_on` para `backend`, pero no hay healthcheck configurado ([docker-compose.yml](docker-compose.yml)). No describas `depends_on` como garantía de que la API ya está lista.

## Seguridad

12. **Restringe los orígenes CORS a los dominios requeridos antes de desplegar o añadir autenticación.** [main.py](backend/app/main.py) permite `allow_origins=["*"]` y también `allow_credentials=True`; reemplaza el comodín por los orígenes explícitos de cada entorno.
