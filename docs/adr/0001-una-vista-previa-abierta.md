# Una sola vista previa abierta

Cada alta o cambio pasa por una vista previa, y Norma puede corregirla con un audio o un texto. Decidimos que haya como máximo una vista previa abierta: pedir otra cosa descarta la anterior y el bot lo avisa en su frase ("Dejé la taza azul sin publicar"). Así una corrección siempre sabe a qué vista previa va, y el estado de la conversación es uno solo para todos los números autorizados.

## Considered Options

- **Botones atados a cada vista previa.** Permite tener varias abiertas, pero un audio de corrección no tiene a cuál aplicarse sin preguntarle a Norma.
