# Taller de Norma

Norma administra sus piezas hablándole a un bot de WhatsApp; la página pública muestra las que están a la venta.

## Piezas

**Pieza**:
Un objeto de cerámica de Norma, con nombre, precio, foto y número.
_Avoid_: producto, artículo, ítem

**Número**:
Identificador correlativo que recibe una pieza al publicarse. Nunca se reutiliza y no se muestra en la página.
_Avoid_: id, código

**Publicada**:
Estado de una pieza que se ve en la página.
_Avoid_: activa, visible

**Sacada**:
Estado de una pieza que dejó de verse en la página, se haya vendido o no. Conserva su número y solo Deshacer la devuelve.
_Avoid_: vendida, borrada, eliminada

**Precio**:
Monto en pesos enteros, sin centavos.

## Conversación

**Autorizado**:
Un número de WhatsApp que puede administrar el taller. Todos comparten el mismo borrador y el mismo Deshacer.
_Avoid_: admin, usuario

**Borrador**:
Lo que Norma mandó para una pieza nueva (foto, nombre, precio) y todavía no confirmó. Hay como máximo uno abierto.
_Avoid_: pendiente

**Vista previa**:
La imagen de la tarjeta, tal como se verá en la página, que el bot manda antes de cada alta o cambio. Hay como máximo una abierta.
_Avoid_: preview, confirmación

**Acción**:
Un cambio aplicado a la página: publicar, sacar, cambiar precio o cambiar foto.
_Avoid_: operación, comando

**Deshacer**:
Revertir la última acción. Vale hasta la siguiente acción, sin plazo.

**Foto tratada**:
La foto de Norma después de enderezarla, encuadrarla y corregirle la luz. La original se conserva.
_Avoid_: foto editada, foto procesada
