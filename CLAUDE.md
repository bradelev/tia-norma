# Taller de Norma

Norma publica piezas por WhatsApp con una foto y un audio; la página pública las muestra. Alcance y requisitos: `docs/prd.md`.

## Comandos

- `pnpm dev`: página local
- `pnpm test`: tests unitarios (Vitest)
- `pnpm lint`, `pnpm typecheck`, `pnpm format:check`: lo mismo que corre CI

## Arquitectura

- `src/domain/`: reglas puras. No importa nada de Next, de la base ni de proveedores.
- `src/ports/`: interfaces hacia afuera (Messenger, Transcriber, Interpreter, Catalog, MediaStore, ImageProcessor).
- `src/adapters/`: una implementación real y un doble en memoria por puerto.
- `src/app/`: página pública y webhook. Solo conecta puertos con el dominio.

## Convenciones

- Documentación en español; código, identificadores y títulos de commit en inglés.
- Commits convencionales (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).
- TypeScript estricto, sin `any`. Zod en cada borde: webhook, modelo, entorno.
- Nada fuera de `docs/prd.md` entra sin agregarlo antes a la lista de recortes.

## Pull requests

- Un issue, un PR, una rebanada vertical. Hasta 300 líneas de diff sin lockfile ni fixtures.
- Descripción con la plantilla, 12 líneas como máximo. El razonamiento largo va a un ADR en `docs/adr/`.
- Nada entra a `main` con CI en rojo.

## Zonas de peligro

Un PR que toca alguna de estas necesita revisión humana antes del merge.

| Zona                     | Qué se verifica                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Webhook                  | Firma, lista de autorizados, 200 inmediato, test de contrato. El payload nunca se loguea.                       |
| Escritura e idempotencia | Unicidad por id de mensaje, transacción, test con mensaje duplicado.                                            |
| Borde con el modelo      | Salida validada con Zod, límite de tiempo, plan B. Si cambia prompt o modelo, `pnpm eval` y el número en el PR. |
| Esquema                  | Migración reversible. Ninguna columna con datos se borra.                                                       |
| Secretos                 | Ninguna clave ni teléfono real en el repo, fixtures ni logs.                                                    |
| Legibilidad              | Mínimos del PRD, axe y prueba sin JavaScript.                                                                   |
| Harness                  | `CLAUDE.md`, hooks y CI van en un PR propio.                                                                    |

## Agent skills

### Issue tracker

GitHub Issues de bradelev/tia-norma, vía `gh`. Ver `docs/agents/issue-tracker.md`.

### Domain docs

Un solo contexto: `GLOSSARY.md` y `docs/adr/` en la raíz. Ver `docs/agents/domain.md`.
