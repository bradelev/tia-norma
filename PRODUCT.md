# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Norma**: ceramista de 70 años, ve mal, no tiene compu ni mail y solo usa WhatsApp. Publica, saca y cambia piezas desde el chat con una foto y un audio.
- **Compradores**: de la misma generación, con la vista cansada y celulares modestos. Entran a la página para ver qué hay y cuánto sale.
- **Quien lee el repo**: llega sin contexto y quiere entender cómo está armado y por qué.

## Product Purpose

Que Norma muestre sus piezas de cerámica en una página pública sin aprender nada nuevo. Ella saca la foto y dice qué es y cuánto sale; el sistema endereza, encuadra y corrige la luz de la foto antes de publicar. Éxito: un comprador lee nombre y precio a un brazo de distancia.

## Positioning

Las fotos se ven bien sin que Norma sepa de fotografía, y sin inventar nada de la pieza: lo que se ve es lo que el comprador recibe.

## Operating Context

- La página es de solo lectura. No hay carrito, pagos, contacto ni link a WhatsApp: quien quiere una pieza ya sabe cómo escribirle a Norma.
- Toda la administración pasa por WhatsApp. La vista previa que recibe Norma es la misma tarjeta que ve el comprador.

## Capabilities and Constraints

- Una sola ruta pública: encabezado con el nombre del taller y una columna de piezas, la más nueva arriba.
- Cada pieza muestra cuatro datos: número, foto 4:5, nombre y precio. Nada más.
- Tocar la foto abre la imagen completa con un link común.
- Funciona con JavaScript desactivado. HTML estático que se regenera al publicar.
- Primera vista de hasta 500 KB y contenido principal en menos de 2,5 s en 4G lenta. Sin tracking, cookies ni banners.
- Precio en pesos con formato "$ 6.000".
- Estado vacío: "Norma está en el taller. Pronto hay piezas nuevas."
- Fuente de verdad del alcance: `docs/prd.md`.

## Brand Commitments

- Nombre: "Taller de Norma" (provisorio, puede cambiar).
- Tipografía del sistema, sin fuentes web.
- La foto manda: sin ilustraciones ni adornos. Ningún adorno baja los mínimos de legibilidad.

## Evidence on Hand

- No hay fotos reales todavía. Los datos de ejemplo usan fotos de muestra con licencia libre, marcadas como muestra, que se reemplazan por las de Norma.
- No hay testimonios, ventas ni métricas: no se inventan.

## Product Principles

1. Norma no aprende nada nuevo.
2. La página se lee a un brazo de distancia; si algo baja el tamaño o el contraste, se descarta.
3. La IA corrige y no inventa: los píxeles de la pieza son los de la foto.
4. Pocas cosas, terminadas. Si hay duda, no se construye.

## Accessibility & Inclusion

| Elemento           | Mínimo                      |
| ------------------ | --------------------------- |
| Texto base         | 20 px                       |
| Nombre de la pieza | 28 px                       |
| Precio             | 32 px, peso fuerte          |
| Contraste de texto | 7:1 (WCAG AAA)              |
| Zoom del navegador | 200 % sin scroll horizontal |

Texto alternativo de cada foto: nombre y precio. Cero violaciones en axe y Lighthouse móvil de 95 o más en las cuatro categorías.
