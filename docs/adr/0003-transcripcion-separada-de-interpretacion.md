# Transcripción separada de la interpretación

Claude no acepta audio, así que el audio pasa primero por `Transcriber` (audio a texto) y después por `Interpreter` (texto a intención, con Claude Haiku 5.5). Lo que Norma escribe entra directo a `Interpreter`, de modo que audio y texto dan el mismo resultado por construcción. Arrancamos con Whisper large-v3 turbo en Groq: tiene plan gratuito y acepta el `.ogg` de WhatsApp tal como llega. Se confirma con el set de 20 audios de R14; si no llega a 18, se prueba `gpt-4o-mini-transcribe` de OpenAI y el cambio es un adaptador.

## Considered Options

- **Un modelo multimodal para todo.** Ata la intención al proveedor de audio y el texto escrito sigue otro camino.
