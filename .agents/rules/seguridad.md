# Regla: Seguridad de Servicios

## Alcance
Configuración de middleware y acceso HTTP del backend, especialmente `backend/app/main.py`.

## Justificación
El middleware CORS actual permite `allow_origins=["*"]` y `allow_credentials=True`. Es una configuración amplia para un servicio que podría incorporar autenticación o desplegarse fuera del entorno local.

## Guía específica del proyecto
- Antes de desplegar públicamente o habilitar autenticación, sustituye el comodín de `allow_origins` por una lista explícita de orígenes permitidos por entorno.
- No amplíes métodos, encabezados, credenciales u orígenes CORS sin justificar qué cliente los necesita.
- Mantén la configuración de desarrollo local y la de despliegue claramente diferenciadas cuando se incorporen valores específicos de entorno.
