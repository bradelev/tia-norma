---
name: Taller de Norma
description: Piezas de cerámica de Norma, como fotos instantáneas sobre la mesa del taller.
colors:
  ground: "#efece6"
  paper: "#ffffff"
  ink: "#1c1b19"
  ink-soft: "#3d3a35"
typography:
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
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
    fontWeight: 600
    lineHeight: 1.5
rounded:
  none: "0"
spacing:
  gutter: "1rem"
  frame: "clamp(0.75rem, 3.5vw, 1.375rem)"
  stack: "2.5rem"
  column: "40rem"
components:
  print:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.frame} {spacing.frame} calc({spacing.frame} * 1.5)"
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

**Creative North Star: "La mesa del taller"**

Cada pieza es una foto instantánea apoyada sobre una mesa de trabajo: marco de papel blanco parejo, margen inferior más ancho, y ahí el nombre y el precio. La página es una sola columna de esas fotos, la más nueva arriba. No hay acento de color: el color lo ponen las piezas.

El sistema existe para que un comprador de 70 años lea nombre y precio a un brazo de distancia. Todo tamaño, peso y contraste se mide contra los mínimos de PRODUCT.md; ninguna decisión visual puede bajarlos. Solo modo claro: el modo oscuro fue rechazado.

**Key Characteristics:**

- Mesa gris cálida, marcos blancos, tinta casi negra; nada más.
- Tipografía del sistema en dos pesos (600 y 800), cifras tabulares.
- Una sola sombra, corta y de contacto.
- Esquinas rectas en todo.

## Colors

Paleta neutra y cálida de cuatro valores; el único color saturado de la página es el de las fotos.

### Neutral

- **Mesa de taller** (ground): fondo de la página, `theme-color` del navegador y relleno de la foto mientras carga.
- **Papel fotográfico** (paper): el marco de cada foto instantánea. También el texto sobre selección.
- **Tinta** (ink): todo el texto principal, el contorno de foco y el fondo de la selección.
- **Tinta suave** (ink-soft): texto secundario (el crédito al pie). Sigue por encima de 7:1 sobre la mesa.

### Named Rules

**The Sin Acento Rule.** No hay color de marca ni de interacción. Si un elemento necesita destacarse, lo hace con tamaño o peso, nunca con color.

**The Siete a Uno Rule.** Todo texto, incluido el secundario, cumple 7:1 contra su fondo. Un gris más claro que ink-soft no entra.

## Typography

**Display Font:** pila del sistema (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif)
**Body Font:** la misma pila

**Character:** Una sola familia, la del teléfono del comprador, en dos pesos. Es un compromiso de PRODUCT.md (sin fuentes web), no un placeholder.

### Hierarchy

- **Title** (800, 2rem, 1.15): el nombre del taller, una vez por página.
- **Price** (800, 2.25rem, 1.15, tabulares): el dato más grande de la página.
- **Name** (600, 1.75rem, 1.2, `text-wrap: balance`): nombre de la pieza.
- **Body** (base 1.25rem, 1.5; se usa en 600): texto corriente y crédito.

### Named Rules

**The Dos Pesos Rule.** Solo 600 y 800. No hay 400 ni cursivas.

**The Precio Entero Rule.** El precio nunca se achica, tampoco con zoom. Bajo zoom fuerte el "$" puede pasar a su propia línea; el monto nunca se parte (`white-space: nowrap`). Límite declarado: un precio de seis cifras necesita unos 390 px de ancho con texto al 200 %; entre 320 y 360 px al 200 % el monto no entra, y no se resuelve achicando el precio.

## Layout

Una columna centrada, máximo 40rem de foto más el margen lateral (gutter de 1rem). Las fotos se apilan con 2.5rem entre sí. El marco (frame) escala con el ancho, de 0.75rem a 1.375rem; el margen inferior del marco es 1.5 veces el lateral y el pie de foto arranca 1.1 marcos debajo de la imagen.

En pantallas anchas y bajas la columna se angosta según la altura del viewport, con un piso de 20rem, para que una foto entera, precio incluido, quepa en pantalla y se vea el borde superior de la siguiente. En 390 × 844 rige lo mismo: foto entera y el borde de la próxima.

Sin scroll horizontal hasta 200 % de zoom.

## Elevation & Depth

Plano salvo por las fotos. Cada marco descansa sobre la mesa con una sola sombra corta de contacto, lo justo para que el papel se separe del fondo.

### Shadow Vocabulary

- **Contacto** (`box-shadow: 0 1px 3px rgb(28 27 25 / 0.2)`): solo en el marco de la foto instantánea.

### Named Rules

**The Una Sombra Rule.** La sombra de contacto es la única. Nada de sombras largas, difusas, desplazadas ni de hover.

## Shapes

Esquinas rectas (0) en marcos, fotos y todo lo demás, como papel fotográfico recortado. Sin bordes ni líneas divisorias: la separación la dan el marco blanco y el espacio. Las fotos son siempre 4:5, recortadas con `object-fit: cover`.

## Components

### Foto instantánea (print)

La pieza firma del sistema.

- **Corner Style:** recto (0).
- **Background:** papel sobre la mesa.
- **Shadow Strategy:** contacto (ver Elevation & Depth).
- **Border:** ninguno.
- **Internal Padding:** marco parejo arriba y a los lados, 1.5 marcos abajo.
- **Contenido:** foto 4:5 enlazada a la imagen completa, luego nombre y precio. Nada más.
- **Vacío:** el mismo marco con un rectángulo 4:5 color mesa y el texto de estado vacío en peso de nombre.

### Links

- **Style:** heredan la tinta; subrayado con offset 0.2em y grosor 0.08em cuando hay texto.
- **Focus:** contorno de tinta de 0.25rem separado 0.25rem del elemento. Es el único estado interactivo.

## Do's and Don'ts

### Do:

- **Do** apoyar cada pieza en un marco de papel con margen inferior ancho y nombre y precio debajo de la foto.
- **Do** dejar que el precio crezca con el zoom y caiga de línea antes que achicarse.
- **Do** usar la pila de fuentes del sistema en 600 y 800, con cifras tabulares en precios.
- **Do** mantener 7:1 de contraste en todo texto.

### Don't:

- **Don't** agregar color de acento, botones, badges ni grillas de tienda con tarjetas.
- **Don't** usar más sombra que el contacto de 1px/3px.
- **Don't** redondear esquinas.
- **Don't** cargar fuentes web ni introducir un modo oscuro.
- **Don't** bajar ningún tamaño por debajo de los mínimos: texto 20 px, nombre 28 px, precio 32 px en peso fuerte.
