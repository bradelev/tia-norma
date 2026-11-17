---
name: Taller de Norma
description: Piezas de cerámica de Norma, cada una en una boleta de talonario de rifa con su número.
colors:
  ground: "#3b2a20"
  cover: "#f6ead6"
  paper-rosa: "#f9b9c7"
  paper-verde: "#a9e1b6"
  paper-amarillo: "#ffe16b"
  paper-celeste: "#a8cff3"
  paper: "#ffffff"
  ink: "#1c1b19"
typography:
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.01em"
  number:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "4rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  price:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.15
    fontFeature: "tnum"
  name:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1
rounded:
  none: "0"
spacing:
  gutter: "1rem"
  frame: "clamp(0.75rem, 3.5vw, 1.375rem)"
  stack: "1.5rem"
  column: "40rem"
  stub: "clamp(4.25rem, 19vw, 6.5rem)"
  perforation: "1.3rem"
components:
  slip:
    backgroundColor: "{colors.paper-rosa}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.frame} {spacing.frame} calc({spacing.frame} * 1.5) 0"
  stub:
    textColor: "{colors.ink}"
    typography: "{typography.number}"
    width: "{spacing.stub}"
    padding: "{spacing.frame} 0.25rem"
  perforation:
    width: "{spacing.perforation}"
  price-tag:
    textColor: "{colors.ink}"
    typography: "{typography.price}"
  piece-name:
    textColor: "{colors.ink}"
    typography: "{typography.name}"
  page-title:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
---

# Design System: Taller de Norma

## Overview

**Creative North Star: "El talonario de rifa"**

La página es un talonario de rifa abierto sobre una mesa. Cada pieza es una boleta: a la izquierda un talón angosto con "N.º" y el número enorme, después una línea perforada de agujeritos redondos con dos muescas troqueladas arriba y abajo, y del otro lado la foto 4:5, el nombre y el precio. El número es como Norma habla de una pieza, así que es el dato que manda en el talón; en el cuerpo de la boleta manda el precio. Arriba está la portada del talonario, crema y perforada, con el nombre del taller. Las boletas se apilan en una columna, la más nueva arriba; en pantallas anchas el talonario se abre en dos.

El papel de cada boleta es uno de cuatro colores vivos de talonario de feria (rosa, verde, amarillo, celeste) y la pieza lo conserva de por vida: el tono sale de `número % 4`. La mesa es madera oscura, mucho más oscura que cualquier papel, y se ve a través de los agujeros de la perforación y de las muescas. Tinta casi negra para todo el texto; la tipografía es la del teléfono del comprador.

El sistema existe para que un comprador de 70 años lea número, nombre y precio a un brazo de distancia. Todo tamaño, peso y contraste se mide contra los mínimos de PRODUCT.md; ningún recurso del talonario puede bajarlos. Solo modo claro.

**Key Characteristics:**

- Mesa de madera oscura, boletas en cuatro papeles vivos que rotan, tinta casi negra.
- Talón con el número en cifras de imprenta tabulares, peso 800.
- Perforación real: agujeros del color de la mesa cada 0.75rem y muescas semicirculares troqueladas.
- Tipografía del sistema, sin fuentes web.
- Una sola sombra de contacto que sigue el troquel.
- Esquinas rectas.

## Colors

Una mesa de madera oscura, una portada crema, cuatro papeles vivos de talonario y una tinta.

### Neutral

- **Mesa de taller** (ground): fondo de la página, `theme-color` del navegador, color de los agujeros y muescas de la perforación, y relleno de la foto mientras carga.
- **Portada** (cover): el papel crema de la portada del talonario, y el color del texto que se apoya directo sobre la mesa, como el crédito de las fotos de muestra.
- **Tinta** (ink): todo el texto, el contorno de foco, el fondo de la selección y la base de la sombra de contacto.
- **Papel blanco** (paper): solo el texto sobre la selección. No es papel de boleta.

### Papeles de talonario

- **Rosa** (paper-rosa): boletas con `número % 4 = 0`.
- **Verde** (paper-verde): `número % 4 = 1`.
- **Amarillo** (paper-amarillo): `número % 4 = 2`.
- **Celeste** (paper-celeste): `número % 4 = 3`.

Los cuatro viven en `src/domain/card.ts` como `--paper-0` a `--paper-3`; la página y la imagen de vista previa leen la misma fuente.

### Named Rules

**The Papel de por Vida Rule.** El papel de una boleta lo decide su número (`número % 4`) y no cambia nunca, ni al reordenar ni al editar. No se elige papel por pieza ni por contenido.

**The Papel No Es Acento Rule.** Los papeles identifican la boleta; no son color de marca ni de interacción. Nada se destaca con color: se destaca con tamaño o peso. No hay botones, badges ni estados de color.

**The Mesa Más Oscura Rule.** La mesa es siempre visiblemente más oscura que los cuatro papeles, para que el troquel y la perforación se lean como agujeros.

**The Siete a Uno Rule.** Todo texto cumple 7:1 contra su fondo, sea un papel o la mesa. No hay tinta suave ni gris secundario.

## Typography

**Display Font:** pila del sistema (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif)
**Body Font:** la misma pila

**Character:** Una sola familia, la del teléfono del comprador. Es un compromiso de PRODUCT.md (sin fuentes web), no un placeholder. Las cifras del número y del precio son tabulares, como en un talonario impreso.

### Hierarchy

- **Number** (800, hasta 4rem, 1, -0.03em, tabulares): el número en el talón. Ocupa todo el ancho que el talón permite; con tres cifras se achica para no salirse (`min(4rem, (talón - 0.5rem) / (cifras × 0.62))`). Cuando el talón pasa arriba vuelve a 4rem.
- **Label** (800, 1.25rem, 1): "N.º" sobre el número en el talón. Es parte de la boleta, no una etiqueta decorativa; el lector de pantalla oye "Número".
- **Title** (800, 2.5rem, 1.05, 0.01em, mayúsculas, `text-wrap: balance`): el nombre del taller en la portada, una vez por página.
- **Price** (800, 2.25rem, 1.15, tabulares): el dato más grande del cuerpo de la boleta.
- **Name** (600, 1.75rem, 1.2, `text-wrap: balance`): nombre de la pieza.
- **Body** (400, 1.25rem, 1.5): la línea bajo el título. El crédito de las fotos de muestra va en 600.

### Named Rules

**The Precio Entero Rule.** El precio nunca se achica, tampoco con zoom. Bajo zoom fuerte el "$" puede pasar a su propia línea; el monto nunca se parte (`white-space: nowrap`).

**The Mínimos Rule.** Ningún texto baja de los mínimos de PRODUCT.md: texto base 20 px, nombre 28 px, precio 32 px en peso fuerte, contraste 7:1, zoom al 200 % sin scroll horizontal.

## Layout

Una columna centrada de boletas con margen lateral de 1rem (gutter) y 1.5rem entre boletas (stack). Desde 64rem el talonario se abre en dos columnas de boletas, con un ancho máximo de 76rem. El ancho máximo es la foto (40rem como mucho) más el talón, la perforación y los márgenes. El talón mide entre 4.25rem y 6.5rem (19vw) y la perforación 1.3rem.

Dentro del cuerpo el marco (frame) escala con el ancho, de 0.75rem a 1.375rem. El cuerpo no tiene margen a la izquierda (la perforación hace de borde), el margen inferior es 1.5 marcos y el pie de foto arranca 1.1 marcos debajo de la imagen.

En pantallas anchas y bajas la columna se angosta según la altura del viewport, con un piso de 20rem, para que una boleta entera, precio incluido, quepa en pantalla y se vea el borde de la siguiente.

Cuando la boleta mide menos de 15em de ancho (teléfono chico, texto grande o zoom al 200 %), el talón pasa arriba como una franja horizontal con "N.º" y el número en línea, la perforación corre de lado a lado con las muescas en sus dos extremos, y el cuerpo recupera su margen izquierdo. Sin scroll horizontal hasta 200 % de zoom.

## Elevation & Depth

Plano salvo por las boletas. Cada boleta descansa sobre la mesa con una sola sombra corta de contacto. Es un `filter: drop-shadow`, no un `box-shadow`, para que siga el contorno troquelado y se vea también dentro de las muescas.

### Shadow Vocabulary

- **Contacto** (`filter: drop-shadow(0 1px 1.5px rgb(28 27 25 / 0.3))`): solo en la boleta.

### Named Rules

**The Una Sombra Rule.** La sombra de contacto es la única. Nada de sombras largas, difusas, desplazadas ni de hover. Un `box-shadow` sobre la boleta ignora el troquel y no entra.

## Shapes

Esquinas rectas (0) en boletas, fotos y todo lo demás, como papel cortado. Las únicas curvas son del troquel: dos muescas semicirculares de 0.6rem de radio donde la perforación toca los bordes, y agujeros redondos de 0.22rem de radio cada 0.75rem a lo largo de la perforación. Ambos se recortan con máscaras y gradientes radiales; dejan ver la mesa. Sin bordes ni líneas divisorias. Las fotos son siempre 4:5, recortadas con `object-fit: cover`.

## Components

### Boleta (slip)

La pieza firma del sistema: talón, perforación y cuerpo en una grilla de tres columnas.

- **Corner Style:** recto (0), con las dos muescas troqueladas en la línea de la perforación.
- **Background:** el papel de la pieza (`número % 4`).
- **Shadow Strategy:** contacto (ver Elevation & Depth).
- **Border:** ninguno.
- **Contenido:** talón con el número; cuerpo con la foto 4:5 enlazada a la imagen completa, nombre y precio. Nada más.
- **Vacío:** una sola boleta amarilla, del ancho de una columna, sin foto. El talón tiene "N.º" y una raya para escribir el número; el cuerpo dice "Norma está en el taller." en tamaño de nombre y "Pronto hay piezas nuevas." en tamaño de texto.

### Portada

- Papel crema (cover) a todo el ancho del talonario, con una fila de agujeros color mesa sobre el borde inferior: de ahí se arrancan las boletas.
- Título en mayúsculas y la línea de estado, en tinta. Sin teléfono ni link a WhatsApp: quien compra ya sabe cómo escribirle a Norma.

### Talón (stub)

- "N.º" arriba y el número debajo, centrados, en tinta 800 con cifras tabulares.
- Relleno: un marco arriba y abajo, 0.25rem a los lados.
- En boletas angostas pasa a ser una franja horizontal sobre el cuerpo.

### Perforación

- Columna de 1.3rem con agujeros color mesa cada 0.75rem; decorativa para el lector de pantalla (`aria-hidden`).
- En la variante angosta corre en horizontal y las muescas se dibujan en sus extremos.

### Links

- **Style:** heredan la tinta; subrayado con offset 0.2em y grosor 0.08em cuando hay texto.
- **Focus:** contorno de tinta de 0.25rem separado 0.25rem del elemento. Es el único estado interactivo.

### Vista previa de WhatsApp

La vista previa que recibe Norma es la misma boleta que ve el comprador, dibujada en `src/adapters/satori/preview-renderer.tsx` con los tokens de `card.ts`: papel según el número, talón al ancho máximo, perforación con agujeros y muescas, y la mesa alrededor. Una pieza nueva muestra el número que va a recibir al publicarse; un cambio, el de la pieza. La foto va a 24rem, más angosta que la columna de la página, para que nombre y precio se lean al tamaño de WhatsApp.

## Do's and Don'ts

### Do:

- **Do** presentar cada pieza como una boleta: talón con "N.º" y número, perforación con muescas, foto 4:5, nombre y precio.
- **Do** asignar el papel por `número % 4` y mantenerlo de por vida.
- **Do** dejar ver la mesa a través de agujeros y muescas, con la mesa más oscura que todo papel.
- **Do** dejar que el precio crezca con el zoom y caiga de línea antes que achicarse.
- **Do** pasar el talón arriba cuando la boleta es angosta, con el número a 4rem.
- **Do** usar la pila de fuentes del sistema, con cifras tabulares en número y precio.
- **Do** mantener 7:1 de contraste en todo texto.

### Don't:

- **Don't** agregar color de acento, botones, badges ni grillas de tienda con tarjetas.
- **Don't** usar más sombra que el contacto `drop-shadow(0 1px 1.5px)`, ni `box-shadow` sobre la boleta.
- **Don't** redondear esquinas; las únicas curvas son las del troquel.
- **Don't** elegir el papel por pieza ni cambiarlo después de publicada.
- **Don't** cargar fuentes web ni introducir un modo oscuro.
- **Don't** bajar ningún tamaño por debajo de los mínimos: texto 20 px, nombre 28 px, precio 32 px en peso fuerte.
