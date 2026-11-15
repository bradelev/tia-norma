# Transcripción separada de la interpretación

Claude no acepta audio, así que el audio pasa primero por `Transcriber` (audio a texto) y después por `Interpreter` (texto a intención, con Claude Haiku 5.5). Lo que Norma escribe entra directo a `Interpreter`, de modo que audio y texto dan el mismo resultado por construcción. Arrancamos con Whisper en Groq: tiene plan gratuito y acepta el `.ogg` de WhatsApp tal como llega. Se confirma con el set de audios de R14; si no llega a la meta, se prueba `gpt-4o-mini-transcribe` de OpenAI y el cambio es un adaptador.

## Medición

`pnpm eval:audio` con 21 audios grabados en el celular, transcriptor e intérprete reales. Cuenta como bien el nombre exacto (sin mayúsculas ni tildes) y el precio exacto. La meta es 19 de 21, el equivalente a 18 de 20 de R14.

| Transcriptor                          | Bien     | Precio bien |
| ------------------------------------- | -------- | ----------- |
| `whisper-large-v3-turbo`              | 14 de 21 | 19 de 21    |
| `whisper-large-v3-turbo` con `prompt` | 14 de 21 | 19 de 21    |
| `whisper-large-v3`                    | 16 de 21 | 21 de 21    |

Queda `whisper-large-v3`: mejor resultado y la más lenta tardó 1,1 s, dentro del límite de 4 s del adaptador. No llega a la meta. Los cinco errores son el nombre: "Plata azul", "Plataondo blanco", "Tetera asmaltada", "Bowe celeste", "Fuertecita ovalada". Norma los corrige en la vista previa, que es lo que R14 prevé para el resto.

El `prompt` probado lleva solo vocabulario genérico de alfarería ("gres, loza, arcilla, engobe, torno, vidriado; precios en pesos, a veces en lucas"), nunca palabras de los nombres esperados, para no amañar la medición. Arregló un precio en euros y rompió "cuatro quinientos", así que no se usa.

El paso siguiente es medir `gpt-4o-mini-transcribe`. Todavía no hay clave de OpenAI; con ella, es un adaptador nuevo y otra corrida de `pnpm eval:audio`.

## Considered Options

- **Un modelo multimodal para todo.** Ata la intención al proveedor de audio y el texto escrito sigue otro camino.
