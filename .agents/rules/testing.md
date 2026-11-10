# Regla: Pruebas y Verificación

## Alcance
Pruebas del backend en `backend/tests/` y del frontend en `frontend/src/`, además de los comandos de validación del proyecto.

## Justificación
`backend/tests/test_routes.py` comprueba estado HTTP, filtros, orden y estructuras de respuesta. `frontend/src/lib/financial-utils.test.ts` prueba KPI, agregados y formateadores. `frontend/package.json` declara los scripts `test`, `lint` y `build`.

## Guía específica del proyecto
- Al cambiar una ruta, verifica el código HTTP y el contenido relevante: filtros, orden, campos o valores de dominio afectados.
- Al cambiar funciones de cálculo o formato del frontend, añade pruebas Vitest en el archivo de pruebas correspondiente.
- Ejecuta las pruebas de la capa modificada (`pytest` para backend; `npm test` para frontend). Cuando el cambio afecte tipos, integración o build, ejecuta además `npm run build` y/o `npm run lint` según corresponda.
- Distingue las comprobaciones manuales con `curl` de las suites automatizadas; informa únicamente los comandos que realmente ejecutaste y sus resultados.
