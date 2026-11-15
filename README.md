# Taller de Norma

Norma publica piezas de cerámica por WhatsApp con una foto y un audio; la página pública las muestra. Alcance y requisitos en [docs/prd.md](docs/prd.md).

## Mediciones

- **R14, audio confiable:** 17 de 21 audios dan nombre y precio exactos (meta: 19). Los 21 precios salen bien. Detalle en [ADR 0003](docs/adr/0003-transcripcion-separada-de-interpretacion.md); se mide con `pnpm eval:audio`.
