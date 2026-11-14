# Fotos de las galerías

Las galerías (Modelo y En vivo) se manejan desde el panel: **/admin**.
Ahí se suben, ordenan, describen y sacan las fotos, y se publica con un botón.

Qué fotos se muestran, en qué orden y con qué crédito está guardado en
`src/content/galerias.json`. No muevas ni renombres archivos de esta carpeta a mano:
si una foto que usa el contenido no está, el build se frena (y la página sigue como estaba).

Las fotos nuevas que se suben desde el panel quedan en `src/assets/subidas/`.
