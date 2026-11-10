# Regla: Contratos de API y Naming

## Alcance
Modelos y endpoints de `backend/app/routes.py`, tipos del frontend en `frontend/src/lib/financial-types.ts` y código que consume esas respuestas.

## Justificación
El contrato `FinancialMovement` se representa tanto con modelos Pydantic en el backend como con tipos TypeScript en el frontend. Los nombres `create_date`, `operation_type` y `business_type`, y los valores válidos de categoría y operación, deben coincidir entre ambas implementaciones.

## Guía específica del proyecto
- Al cambiar campos, tipos o valores admitidos de un modelo backend, actualiza el tipo TypeScript correspondiente en el mismo cambio.
- Conserva los nombres de campo y valores de dominio existentes salvo que el cambio incluya una migración coordinada del contrato.
- Mantén los endpoints tipados con modelos Pydantic y usa validación de parámetros con `Query` cuando corresponda.
- Para cada cambio de contrato, actualiza o añade pruebas de respuesta y consumo para los campos afectados.
