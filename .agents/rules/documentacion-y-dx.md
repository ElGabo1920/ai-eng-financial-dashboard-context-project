# Regla: Documentación y Experiencia de Desarrollo

## Alcance
Instrucciones de ejecución y configuración en `README.es.md`, `docker-compose.yml`, `frontend/vite.config.ts` y archivos de configuración de los servicios.

## Justificación
Compose define los servicios `frontend` y `backend`; el proxy de Vite apunta al hostname `backend`, disponible en la red de Compose. La documentación menciona `frontend/.env.example`, que no existe actualmente. Compose usa `depends_on`, pero no configura healthcheck.

## Guía específica del proyecto
- Describe por separado la ejecución con `docker compose` y la ejecución directa de Vite/backend. El proxy `http://backend:8000` funciona dentro de Compose; para desarrollo fuera de Docker, explica cómo configurar un backend accesible desde el host.
- Mantén las instrucciones de variables de entorno sincronizadas con los archivos existentes. Si se documenta copiar `.env.example`, incluye y conserva ese archivo; de lo contrario, describe la configuración vigente directamente.
- Documenta los puertos publicados: frontend `5173`, API `8000` y debugpy `5678`.
- No presentes `depends_on` como garantía de disponibilidad del backend. Actualmente Compose no declara healthcheck ni espera a que `/health` responda.
- Usa `/health` para comprobar el backend y prueba `/api/metrics` a través del puerto 5173 para comprobar el proxy.
