# PRD: La página de la tía Norma

Braulio

## Resumen y apuesta

Norma publica una pieza con una foto y un audio: saca la foto y dice qué es y cuánto sale. Un bot de WhatsApp mejora la foto, le muestra cómo queda y publica cuando ella toca "Sí". La página pública es una columna de fotos grandes con nombre y precio, igual al boceto.

La apuesta tiene tres partes, en este orden de prioridad:

1. **Buenas fotos desde un celular de gama media.** Cada foto se endereza, se encuadra y se corrige de luz antes de publicarse, sin inventar nada de la pieza. Es el diferencial visible.
2. **Legibilidad de verdad.** La página se diseña para alguien que ve mal y usa un celular viejo. Es el criterio del brief que más pesa.
3. **Un repo fácil de recorrer.** El código y la documentación se tratan como parte del producto: se entiende qué hace cada parte y por qué se decidió así.

Regla que gobierna el documento: pocas cosas, terminadas. Toda feature que no esté en este PRD queda afuera y se documenta por qué.

## Brief y restricciones

Cada frase del brief se lee como un requisito. Esta tabla es la fuente de verdad cuando haya dudas de alcance.

| Lo que dice el brief | Requisito que sacamos |
| --- | --- |
| Norma tiene 70 años, no tiene compu ni mail, no ve bien y solo usa WhatsApp | Toda la administración ocurre dentro de WhatsApp. Sin login, sin panel, sin mail. |
| El boceto es una página con una grilla: una imagen, título y precio por producto | Una sola ruta pública. Tres datos por pieza y nada más. |
| "No tiene carrito, no tiene link a WhatsApp, nada" | No se agrega ningún canal de compra. Quien quiere una pieza ya sabe cómo escribirle. |
| Preguntó cómo hace si se queda sin piezas, agrega una, o cambia foto o precio | Cuatro operaciones exactas: agregar, sacar, cambiar foto, cambiar precio. |
| Los compradores "están más o menos en la misma" | Muy fácil de usar y de leer pesa más que la estética. |

## Usuarios

Hay tres usuarios y cada uno juzga algo distinto.

| Usuario | Contexto | Qué necesita | Cómo sabemos que funcionó |
| --- | --- | --- | --- |
| Norma | 70 años, ve mal, solo WhatsApp, profe de plástica | Publicar y sacar piezas sin aprender nada nuevo | Publica una pieza con una foto, un audio y un toque, en menos de 30 segundos y sin ayuda |
| Compradores | Misma generación, celular modesto, vista cansada | Ver piezas y precios sin esfuerzo | Leen nombre y precio a un brazo de distancia |
| Quien lee el repo | Llega sin contexto del proyecto | Entender rápido cómo está armado y por qué se decidió cada cosa | Levanta el proyecto en 5 minutos y sigue el tutorial sin preguntar |

## Principios

Estos siete principios deciden los empates. Si una decisión de implementación choca con uno, gana el principio.

1. **Norma no aprende nada nuevo.** Sacar una foto, mandar un audio y tocar un botón ya los sabe hacer.
2. **Una acción, una confirmación.** Nunca un asistente de varios pasos ni un menú.
3. **Nada se publica sin que Norma lo vea antes.** La vista previa es la imagen de la tarjeta, no una descripción.
4. **Todo error se deshace con un toque.**
5. **La página se lee a un brazo de distancia.** Si un diseño baja el contraste o el tamaño, se descarta.
6. **La IA transcribe y corrige; no inventa.** Las palabras son de Norma y los píxeles de la pieza son los de su foto.
7. **Si hay duda, no se construye.** Se anota en la lista de recortes.

## Alcance

Entran cinco capacidades. Todo lo demás queda afuera a propósito y la lista de recortes se publica en el repo.

### Entra

- Publicar una pieza con una foto y un audio (o texto) con el nombre y el precio.
- Tratamiento automático de cada foto: enderezar, encuadrar, corregir luz y nitidez.
- Sacar una pieza ("vendí la 7", "sacá la 7"). Vendida y sacada son la misma operación: la pieza deja de mostrarse.
- Cambiar el precio o la foto de una pieza, nombrándola por su número o por su nombre.
- Deshacer la última acción.

### No entra

| Recorte | Motivo |
| --- | --- |
| Carrito, pagos, pedidos | El brief lo excluye. Norma arregla por mensaje. |
| Link o número de WhatsApp en la página | El boceto no lo tiene, y publicar el celular de una señora de 70 años la expone a spam. |
| Estadísticas, ventas, inventario | Nadie los pidió. Norma preguntó por cuatro operaciones. |
| Sección de vendidas, encargos a medida | Crean demanda y estados que Norma no pidió. |
| Categorías, buscador, filtros, varias fotos | El boceto es una grilla con una imagen. |
| Cambiar el nombre de una pieza | No está en el pedido. Se resuelve sacando y publicando de nuevo. |
| Panel web, login, PWA | Norma no tiene compu ni mail. |
| Voz sintética para las respuestas | Suma un proveedor. Se usan tres audios grabados por una persona. |
| Multi-tienda, multi-usuario | Es la página de Norma. |
| Quitar el fondo de la foto | Necesita un modelo de segmentación que no entra en una función de Vercel, y reemplaza píxeles alrededor de la pieza (principio 6). |
| Corregir perspectiva o nivelar el horizonte | Problema abierto de visión por computadora. Enderezar se limita a la orientación. |

También queda afuera todo retoque que invente contenido: fondos generados, relleno o "mejora" con IA generativa. Muestra una pieza que no es la que el comprador recibe.

Evaluados y descartados por el mismo motivo, el boceto tiene imagen, título y precio y nada más: el audio con la voz de Norma en cada pieza, un simulador web del chat y un modo demo abierto al público.

## Flujos de Norma por WhatsApp

Norma habla con un contacto agendado como "Mi página". Publicar lleva una foto, un audio y un toque.

### Publicar

1. Norma saca una foto de la pieza y la manda.
2. Manda un audio: "taza azul, seis mil". Puede escribirlo, o mandar el audio antes que la foto.
3. El bot responde con la imagen de la tarjeta tal como se va a ver, con la foto ya tratada, y dos botones: "Sí, publicar" y "No, corregir".
4. Con "Sí", la pieza queda publicada con el siguiente número. El bot confirma: "Listo. Es la pieza 7."
5. Con "No", Norma dice qué está mal ("sale siete mil", "es un plato") o manda otra foto. El bot arma una vista previa nueva y vuelve al paso 3.

Si falta el nombre o el precio, el bot pide solo lo que falta. Los números de pieza son correlativos y no se reutilizan.

### Tratamiento de la foto

Cada foto pasa por el mismo tratamiento antes de la vista previa, y Norma aprueba el resultado.

| Paso | Qué hace |
| --- | --- |
| Enderezar | Corrige la orientación según los metadatos EXIF. No corrige perspectiva. |
| Encuadrar | Recorta alrededor de la pieza en formato 4:5, con el mismo margen en todas. Primero con el recorte por atención de `sharp`; un modelo entra solo si el set de 20 fotos muestra que hace falta. |
| Luz y color | Ajusta niveles y balance de blancos. |
| Nitidez | Enfoque suave y reducción de ruido. |
| Control de calidad | Si la foto salió movida o muy oscura, no avanza. El bot pide otra con un audio: "salió oscura, acercate a la ventana". |

El tratamiento nunca agrega ni reemplaza píxeles de la pieza. Una foto movida no se arregla con filtros: se vuelve a sacar.

### Otras operaciones

| Norma dice o escribe | Qué pasa | Respuesta del bot |
| --- | --- | --- |
| "Vendí la 7" o "sacá la 7" | La pieza 7 deja de mostrarse | Foto de la pieza, "Saqué la pieza 7" y botón "Deshacer" |
| "La 7 ahora sale seis mil" | Cambia el precio | Vista previa con "Sí, cambiar" y "No" |
| Foto nueva y "esta es la 7" | Cambia la foto | Vista previa con "Sí, cambiar" y "No" |
| Toca "Deshacer" | Revierte la última acción | Vista previa de cómo quedó |
| Cualquier otra cosa | Nada cambia | Audio grabado de ayuda |

Norma puede nombrar una pieza por su número o por su nombre: "vendí la 7" y "vendí la taza azul" valen igual. Si el nombre coincide con más de una pieza, el bot muestra las fotos y pregunta cuál. El número aparece en los mensajes del bot y no en la página.

### Reglas de la conversación

- Cada respuesta del bot es una imagen o un audio, más una frase de hasta 160 caracteres y como máximo 2 botones.
- Sin menús, sin "paso 1 de 3", sin emojis decorativos.
- Tres audios grabados por una persona: bienvenida, ayuda y "no te entendí, probá de nuevo".
- Una vista previa sin respuesta vence a las 24 horas y no cambia nada.
- "Deshacer" vale hasta la siguiente acción de Norma.
- El bot nunca queda en silencio: ante cualquier falla responde con el audio de "probá de nuevo".

## Página pública

Una sola ruta con una columna de piezas. Cada pieza muestra la foto a todo el ancho, el nombre y el precio, como en el boceto.

### Estructura

- Encabezado: solo el nombre del taller.
- Lista de piezas, la más nueva arriba. Una columna en celular; el ancho se limita a 640 px en pantallas grandes.
- Tocar la foto abre la imagen completa con un link común, sin JavaScript.
- Estado vacío: "Norma está en el taller. Pronto hay piezas nuevas."

### Legibilidad

| Elemento | Mínimo |
| --- | --- |
| Texto base | 20 px |
| Nombre de la pieza | 28 px |
| Precio | 32 px, peso fuerte |
| Contraste de texto | 7:1 (WCAG AAA) |
| Zoom del navegador | 200 % sin scroll horizontal |

- Tipografía del sistema, sin fuentes web que descargar.
- Precio con formato "$ 6.000", en cifras legibles, nunca en una fuente decorativa.
- Texto alternativo de cada foto: nombre y precio.

### Rendimiento

- HTML estático que se regenera cuando Norma publica. Funciona con JavaScript desactivado.
- Imágenes responsivas en formatos modernos, con carga diferida debajo del primer pantallazo.
- Presupuesto: primera vista de hasta 500 KB y contenido principal visible en menos de 2,5 segundos en 4G lenta.
- Sin tracking, sin cookies, sin banners.

### Dirección visual

La foto manda. Todas las piezas se ven con el mismo encuadre y la misma luz, sobre un fondo claro y cálido, sin ilustraciones ni adornos. Los precios parecen etiquetas. La dirección final se cierra en una pasada de diseño, con una condición: ningún adorno baja los mínimos de la tabla.

## Requisitos y criterios de aceptación

Diecisiete requisitos en dos tablas. Cada uno tiene un criterio que se verifica con un test automático o una medición.

| ID | Requisito | Criterio de aceptación |
| --- | --- | --- |
| R1 | Publicar con foto y audio | Dada una foto y un audio con nombre y precio, cuando Norma toca "Sí, publicar", la pieza aparece en la página en menos de 10 segundos con nombre y precio correctos. |
| R2 | Vista previa obligatoria | Ninguna alta ni cambio llega a la página sin un "Sí". Sacar una pieza es inmediato y ofrece "Deshacer". |
| R3 | Texto en lugar de audio | Si Norma escribe en vez de hablar, el resultado es el mismo. Si falta el nombre o el precio, el bot pide solo eso. |
| R4 | Sacar una pieza | "Vendí la N" o "sacá la N" quitan la pieza N de la página. Vale el número o el nombre. Si no hay coincidencia, o hay más de una, el bot pregunta y no cambia nada. |
| R5 | Cambiar precio | "La N ahora sale X" genera vista previa y aplica al confirmar. |
| R6 | Cambiar foto | Una foto con referencia a la pieza N reemplaza su imagen al confirmar. |
| R7 | Deshacer | "Deshacer" revierte exactamente la última acción aplicada y nada más. |
| R8 | Solo Norma administra | Mensajes de otros números se descartan sin respuesta. Una firma inválida devuelve 401. |
| R9 | Idempotencia | El mismo mensaje entregado dos veces produce un solo efecto. |
| R10 | El bot nunca calla | Si el procesamiento de un mensaje falla o tarda más de 15 segundos, Norma recibe el audio de "probá de nuevo". |
| R11 | Precio sin ambigüedad | "Seis mil", "6 mil", "6000" y "$6.000" se guardan como 6000 y se muestran como "$ 6.000". |
| R12 | Página accesible | Cero violaciones en axe, contraste 7:1, Lighthouse móvil de 95 o más en las cuatro categorías. |
| R13 | Página sin JavaScript | Con JavaScript desactivado se ven todas las piezas y se abre la foto completa. |
| R14 | Audio confiable | En un set de 20 audios reales, nombre y precio se entienden bien en 18 o más. El resto se corrige en la vista previa. |

| ID | Requisito de foto | Criterio de aceptación |
| --- | --- | --- |
| R15 | Foto tratada | Toda foto publicada está enderezada, encuadrada en 4:5 con la pieza centrada y con la luz corregida. La original se conserva. |
| R16 | Control de calidad | Una foto movida o muy oscura no llega a la vista previa: el bot pide otra y dice por qué. |
| R17 | Fidelidad | El tratamiento no agrega ni reemplaza contenido de la pieza. Se revisa a ojo en 20 pares de original y tratada. |

### Métricas de éxito

- Norma publica una pieza con una foto, un audio y un toque, en menos de 30 segundos.
- Una persona de unos 70 años que no vio el producto publica su primera pieza sin ayuda.
- Los números de R12 y R14 y los pares de antes y después de R17 se muestran en el README.

## Arquitectura y stack

Un solo proyecto Next.js desplegado en Vercel sirve la página y recibe el webhook de WhatsApp. El dominio es código puro y todo lo externo entra por seis puertos.

Ciclo de una publicación: Norma manda foto → se arma la vista previa → ¿publica? → sí: se guarda la pieza y la página se regenera → no: el bot pide nombre y precio y arma otra vista previa. Nada llega a la página sin el sí de Norma.

La vista previa se arma con la foto tratada y con el nombre y el precio del audio. Si Norma dice que no, corrige por voz o texto y el bot arma otra.

### Decisiones

| Tema | Elección | Por qué | Descartado |
| --- | --- | --- | --- |
| Framework y hosting | Next.js (App Router) en Vercel | Un deploy para página y webhook | Dos servicios separados |
| Lenguaje | TypeScript en modo estricto | Los contratos entre capas quedan en los tipos | JavaScript |
| Datos | Postgres en Supabase, con Drizzle | Unicidad por id de mensaje para R9 y escrituras atómicas. Drizzle deja ver el SQL que enseña el tutorial | Un JSON en un archivo: dos webhooks seguidos se pisan. Prisma: suma un DSL y un paso de generación |
| Imágenes | Supabase Storage | Mismo proveedor que la base: un servicio menos | Vercel Blob; guardarlas en la base |
| Mensajería | WhatsApp Cloud API directa | Sin intermediario ni costo de plataforma | Un proveedor BSP |
| Audio | Puerto `Transcriber` (audio a texto) separado de `Interpreter` (texto a intención) | Audio y texto escrito pasan por el mismo `Interpreter`: R3 se cumple por construcción. Claude no acepta audio | Un modelo multimodal para todo |
| Intención | Claude Haiku 5.5 detrás de `Interpreter`, con salida validada por Zod | Extraer nombre y precio es una tarea chica; cambiar de modelo es cambiar un adaptador | Atarse a un SDK en el dominio |
| Proveedor de transcripción | Se decide con el set de evaluación de R14 y queda en un ADR | La decisión se apoya en una medición | Elegir por costumbre |
| Vista previa | Imagen generada en el servidor con los mismos tokens de diseño que la página | Norma ve lo mismo que el comprador | Describir la tarjeta con texto |
| Publicación | Página estática que se revalida al escribir | R13 y el presupuesto de rendimiento | Render por pedido |
| Webhook | Responde 200 enseguida y procesa con `after()` de Next | Meta reintenta si la respuesta tarda | Procesar antes de responder; un worker aparte |
| Pausa del plan gratis | Cron diario de Vercel que consulta la base | Supabase pausa los proyectos gratis sin actividad y las fotos dejarían de verse | Plan pago |

### Tratamiento de imagen

- Un puerto, `ImageProcessor`, con un adaptador sobre `sharp` que corre dentro de Next: orientación, recorte, niveles y nitidez. Es determinístico y se prueba con imágenes fijas. Sin Python ni workers.
- El encuadre usa el recorte por atención de `sharp`. Si en el set de 20 fotos falla, un modelo devuelve la caja que rodea la pieza y el recorte lo sigue haciendo `sharp`.
- El control de calidad usa dos medidas baratas: varianza del laplaciano para la nitidez y luminancia media para la luz. Ninguna necesita un modelo.
- Se guardan la original y la tratada. Deshacer y volver a tratar no pierde nada.

### Puertos y datos

```
Puertos
  Messenger       recibe y envía mensajes, botones, imágenes y audios
  Transcriber     audio -> texto
  Interpreter     texto -> intención validada
  Catalog         piezas, borradores, acciones
  MediaStore      guarda fotos y vistas previas
  ImageProcessor  endereza, encuadra y corrige cada foto

Tablas
  pieces              id, number, name, price, image_url, status, created_at, updated_at
  drafts              id, kind, payload, preview_url, expires_at
  actions             id, kind, before, after, created_at      (para deshacer)
  processed_messages  wa_message_id unique                     (para idempotencia)
```

Cada puerto tiene un adaptador real y un doble en memoria. Los tests y el simulador local usan los dobles.

### Seguridad

- Verificación de firma `X-Hub-Signature-256` en cada pedido al webhook.
- Lista de números autorizados: solo el de Norma administra.
- Variables de entorno validadas con Zod al arrancar. Ningún secreto en el repo.
- Los logs no guardan números de teléfono ni contenido de mensajes.

### Límites y costos de WhatsApp

- El número de prueba de Meta envía gratis a un máximo de 5 destinatarios verificados ([Meta, Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/)). Alcanza para el demo.
- Desde el 1 de octubre de 2026 las respuestas dentro de la ventana de 24 horas se cobran, con 1.000 mensajes de servicio gratis por mes por número ([Meta, Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)). El uso de Norma queda muy por debajo.
- Los botones de respuesta admiten hasta 3 opciones de 20 caracteres ([Meta, Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)).
- Los audios que se envían como mensaje de voz deben ser `.ogg` con códec OPUS ([Meta, Audio messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/audio-messages)).

## Un repo fácil de recorrer

El repo se trata como producto: alguien que llega sin contexto tiene que poder recorrerlo de arriba abajo y entender qué se hizo y por qué.

### Estructura

```
src/
  domain/      reglas puras: intenciones, precio, numeración, deshacer
  ports/       Messenger, Transcriber, Interpreter, Catalog, MediaStore, ImageProcessor
  adapters/    whatsapp, transcripción, claude, postgres, supabase-storage, sharp, y sus dobles en memoria
  app/         página pública y webhook
evals/         20 audios y 20 fotos, y el script que los mide
docs/adr/      una decisión por archivo
docs/tutorial/ cinco capítulos
```

### Prácticas obligatorias

| Área | Práctica |
| --- | --- |
| Tipos | TypeScript estricto, sin `any`. Zod en cada borde: webhook, modelo, entorno. |
| Dominio | Sin dependencias de framework. Cobertura completa de las reglas con tests unitarios. |
| Tests de contrato | El webhook se prueba con payloads reales de Meta guardados como fixtures, incluidos duplicados y firmas inválidas. |
| Tests de punta a punta | Playwright sobre la página, con axe y con JavaScript desactivado. |
| Evaluación del modelo | `pnpm eval` corre el set de audios y de fotos y reporta aciertos. El resultado va al README. |
| CI | GitHub Actions: lint, tipos, tests, build y Lighthouse en cada PR. Nada entra a `main` en rojo. |
| Historial | Commits convencionales y PRs chicos con el porqué en la descripción. El historial se lee como un relato. |
| Decisiones | Un ADR corto por cada fila de la tabla de decisiones. |
| Simulador | `pnpm sim` permite conversar con el bot en la terminal, sin cuenta de Meta ni claves. |
| Arranque | `pnpm dev` funciona con datos de ejemplo y los dobles en memoria, en menos de 5 minutos. |

### Documentación como tutorial

1. Leer un brief y recortar: de qué frase sale cada requisito.
2. Dominio primero: modelar las intenciones antes de tocar WhatsApp.
3. Un webhook seguro: firma, lista de autorizados, idempotencia.
4. IA con salida estructurada y cómo medirla.
5. Una página accesible sin JavaScript.

Además: `docs/lo-que-no-hicimos.md` con la tabla de recortes, y `CLAUDE.md` con las reglas de este PRD para trabajar en Claude Code.

### Convenciones

- Documentación en español; código e identificadores en inglés.
- Licencia MIT.
- El README declara qué se hizo con IA y qué decisiones fueron humanas.

## Harness y pull requests

El proyecto se construye con las skills de Matt Pocock, y cada PR se lee en una pantalla. Las skills no traen una regla de PR ni una lista de zonas de peligro: esas dos las define este documento.

### Flujo con las skills

| Paso | Skill | Qué deja en el repo |
| --- | --- | --- |
| 1. Configurar | `setup-matt-pocock-skills` | Bloque de skills en `CLAUDE.md`, GitHub Issues como tracker, `docs/agents/` |
| 2. Afinar este PRD | `grill-with-docs` | `CONTEXT.md` con el vocabulario del dominio y los primeros ADRs |
| 3. Publicar el PRD | `to-prd` | Issue padre |
| 4. Partir el trabajo | `to-issues` | Issues en rebanadas verticales, cada una demostrable sola |
| 5. Construir | `tdd` | Un ciclo rojo, verde, refactor por issue |
| 6. Revisar | `code-review` | Reporte en dos ejes: estándares del repo y fidelidad al issue |
| 7. Proteger git | `git-guardrails-claude-code` | Hooks que bloquean push, reset y borrados destructivos |

### Archivos del harness

| Archivo | Contenido | Límite |
| --- | --- | --- |
| `CLAUDE.md` | Comandos, reglas de PR, zonas de peligro, links a los demás | 60 líneas |
| `CONTEXT.md` | Glosario: pieza, foto tratada, vista previa, borrador, sacar | Una línea por término |
| `CODING_STANDARDS.md` | Solo lo que el linter no puede verificar | 40 líneas |
| `docs/adr/` | Una decisión por archivo | Una pantalla cada uno |
| `.github/pull_request_template.md` | La plantilla de abajo | 4 secciones |
| Hooks | Guardrails de git; lint, tipos y tests antes de cada commit | |

### Reglas de PR

- Un issue, un PR, una rebanada vertical.
- Hasta 300 líneas de diff, sin contar lockfile ni fixtures. Si pasa, se parte.
- La descripción usa la plantilla y no supera 12 líneas.
- El razonamiento largo va a un ADR. El PR lo enlaza.
- El reporte de `code-review` se pega como comentario solo si tiene hallazgos.

```
## Qué cambia
Una o dos frases, en términos de Norma o del comprador.

## Por qué
Closes #N

## Cómo verlo
Un comando o un paso.

## Zonas de peligro
Ninguna, o una línea por zona tocada.
```

No va en un PR: el diff contado archivo por archivo, el relato del proceso, resultados de tests que CI ya muestra, listas de aprendizajes, emojis.

### Zonas de peligro

Un PR que toca una zona necesita revisión humana antes del merge. El resto puede entrar con CI en verde.

| Zona | Dónde | Qué se verifica siempre |
| --- | --- | --- |
| Webhook | `adapters/whatsapp`, ruta del webhook | Firma, lista de autorizados, respuesta 200 inmediata, test de contrato. El payload nunca se loguea. |
| Escritura e idempotencia | `Catalog`, `processed_messages` | Unicidad por id de mensaje, transacción, test con mensaje duplicado. |
| Borde con el modelo | `Transcriber`, `Interpreter` y sus adaptadores | Salida validada con Zod, límite de tiempo, plan B. Si cambia el prompt o el modelo, corre `pnpm eval` y el número va en el PR. |
| Esquema | Migraciones | Migración reversible. Ninguna columna con datos se borra. |
| Secretos | Entorno, fixtures, logs | Ninguna clave ni número de teléfono real en el repo. |
| Mínimos de legibilidad | Página y tokens de diseño | Tabla de mínimos, axe y la prueba sin JavaScript. |
| Alcance | Cualquier archivo | Algo fuera de este PRD no entra sin actualizar antes la lista de recortes. |
| El harness mismo | `CLAUDE.md`, hooks, CI | Va en un PR propio. Un agente no afloja sus propias reglas dentro de un PR de feature. |

## Orden de recorte

Si algo se atrasa, se recorta en este orden: cambiar foto, tutorial capítulos 4 y 5, audios grabados. Publicar, el tratamiento básico de fotos, sacar y la página no se tocan.

## Riesgos y preguntas abiertas

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| El audio se entiende mal | Precio o nombre equivocado | Vista previa obligatoria, corrección por voz o texto, set de evaluación |
| El alta en Meta se demora | Sin prueba real en WhatsApp | Empezar antes que nada; el simulador evita que bloquee el desarrollo |
| Crece el alcance | No se termina nada perfecto | Principio 7 y orden de recorte |
| La página sin forma de contacto confunde a un comprador nuevo | Alguien no sabe cómo comprar | Se revisa en la prueba con una persona real |
| Supabase pausa el proyecto gratis | Las fotos dejan de verse tras una semana sin uso | Cron diario de Vercel; se reactiva desde el panel en un toque |

Dos riesgos propios del tratamiento de fotos:

- **Se come el tiempo.** El procesamiento de imágenes no tiene fondo. Por eso se limita a lo básico y quitar el fondo quedó afuera.
- **El brief no lo pide.** Dice que los compradores no son exigentes con cómo se ve. El argumento que lo sostiene es de legibilidad: una pieza bien encuadrada y con luz se ve mejor para alguien con la vista cansada.

### Preguntas abiertas

- [ ] Quién hace de Norma en la prueba con una persona real.
- [ ] Quién graba los tres audios.
- [ ] Nombre del sitio y dominio.
- [ ] Confirmar que la página no muestra cómo contactar a Norma. Hoy la respuesta es no, por el boceto y por privacidad.

### Fuentes

- [Meta, Cloud API Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started/)
- [Meta, Pricing on the WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [Meta, Messages reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [Meta, Audio messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/audio-messages)
