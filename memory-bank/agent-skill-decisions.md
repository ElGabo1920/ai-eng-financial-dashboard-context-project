# Decisiones de Skills del Agente

## TypeScript Best Practices

Se cargó `cursor/plugins@typescript-best-practices` junto con sus dependencias explícitas `principle-type-system-discipline` y `principle-boundary-discipline` en `.agents/skills/`.

**Justificación basada en el repositorio:** el frontend usa TypeScript 6 y React 19; `frontend/package.json` declara el build como `tsc -b && vite build`. Además, los contratos de la API existen en Python y en tipos TypeScript del frontend. La skill orienta al agente a mantener modelos estrictos, representar variantes con tipos discriminados, evitar `any`, derivar tipos de contratos autoritativos, validar datos externos en límites y mantener la lógica interna tipada/pura.

**Aplicación contextual:** no introducir una librería de schemas solo para un guard aislado; la propia skill lo desaconseja. Las reglas específicas de branded types o uniones discriminadas se aplican cuando resuelven ambigüedades reales, no como complejidad por defecto. El proyecto es Vite/React cliente; recomendaciones exclusivas de servidor o frameworks no presentes no aplican automáticamente.

## Principios cargados

- `principle-type-system-discipline`: representar estados válidos con tipos, derivar formas desde contratos autoritativos y tratar entradas externas como no confiables hasta validarlas.
- `principle-boundary-discipline`: concentrar validación y manejo de errores en límites como API/configuración, y mantener el dominio interno tipado y la lógica pura.

## Skills evaluadas y no seleccionadas

Se ejecutó `npx skills find seo`. No se instaló una skill SEO: el producto documentado es un dashboard financiero operativo y no hay evidencia de que las páginas deban indexarse públicamente. El trabajo puntual de metadata del frontend queda cubierto por buenas prácticas generales de despliegue, sin adoptar una guía de SEO de contenido que no corresponde al uso documentado.
