# Progreso del Proyecto

Actualizado: 2026-11-11

## Skills cargadas en el agente

- **Accessibility** (`addyosmani/web-quality-skills`): auditoría y mejoras basadas en WCAG 2.2, con evidencias Lighthouse/axe y comprobaciones manuales de teclado, foco, lector de pantalla, contraste, zoom y movimiento reducido.
- **Vercel React Best Practices** (`vercel-labs/agent-skills`): optimización React priorizada por impacto, incluyendo cascadas asíncronas, bundles, data fetching cliente, rerenders y renderizado. Las instrucciones exclusivas de Next.js/RSC se aplican solo si el proyecto adopta esas tecnologías.
- **TypeScript Best Practices** (`cursor/plugins`), junto con `principle-type-system-discipline` y `principle-boundary-discipline`: estados modelados con precisión, `unknown` en límites externos, tipos derivados de contratos autoritativos, validación en los límites y lógica de dominio tipada. Se eligió porque el frontend usa TypeScript 6, `tsc -b` y contratos de API relacionados entre Python y TypeScript.
- **Skill interna `financial-dashboard-metrics`**: creada en `.skills/financial-dashboard-metrics/SKILL.md` y cargada para Copilot en `.agents/skills/financial-dashboard-metrics/SKILL.md`. Especifica objetivo, entradas, flujo, salida esperada y criterios de aceptación para cambios de métricas, filtros, alertas, categorías y comparativas.

La búsqueda SEO se ejecutó (`npx skills find seo`), pero no se instaló una skill SEO: el repo documenta un dashboard financiero operativo y no demuestra un objetivo de indexación pública.

## Cambios de frontend verificados

- `frontend/index.html`: título y descripción sustituyen el título genérico.
- `frontend/src/index.css`: se quitó la referencia a Inter no suministrada; queda un stack de fuentes del sistema.
- `frontend/src/App.tsx`: los gráficos Recharts se cargan mediante imports dinámicos con boundaries `Suspense` independientes.
- `frontend/src/components/dashboard/chart-skeleton.tsx`: skeleton compartido con dimensiones reservadas para los gráficos.
- Tarjetas KPI y encabezados de gráficos reservan altura para reducir saltos de layout durante la carga.

No se reescribió el dashboard ni se cambió la API/backend; fueron ajustes puntuales de metadata, carga de bundle y estabilidad de layout.

## Verificación

- `docker compose run --rm --no-deps frontend npm run build`: código 0; `tsc -b` y Vite correctos, sin warnings en la última ejecución. Tras el code splitting, Vite produjo chunks principales de aproximadamente 342 kB y 188 kB, sin la advertencia anterior de chunk >500 kB.
- `docker compose run --rm --no-deps frontend npm run lint`: código 0.
- `git diff --check`: código 0.
- Typecheck estricto aislado de `frontend/specs/api-types.ts` y `param-types.ts`: código 0.
- La auditoría de accesibilidad fue estática. Los tokens principales de texto midieron entre 5.17:1 y 19.66:1 en los pares revisados; Lucide oculta automáticamente sus SVG decorativos y Recharts tiene `accessibilityLayer` activado por defecto.
- No se pudo hacer auditoría Lighthouse/axe ni prueba manual con teclado/lector de pantalla: el dashboard/API estaban detenidos y no había Chrome/Lighthouse disponibles. No se afirma conformidad WCAG completa.

## Validación de la skill interna

Se aplicó a una tarea concreta de planificación de la tabla de anomalías. Produjo una guía que identifica `GET /api/metrics/alerts`, `AlertsParams`/`AlertsResponse`, los campos `period`, `outcome_total`, `baseline_average` e `increase_ratio`, la conversión ratio a porcentaje y la comparación estricta `increase_ratio > threshold`. También detecta que el baseline del backend promedia todos los períodos anteriores, no una ventana de tres. No se modificaron componentes durante esa prueba de la skill.
