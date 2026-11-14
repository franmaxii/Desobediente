# Fotos de las galerías (Modelo y En vivo)

Las fotos de `src/assets/modelo/` aparecen solas en la sección «Modelo» y las de
`src/assets/en-vivo/` en «En vivo» (cada una con su link en el menú).
Si una carpeta queda sin fotos, su sección no se muestra.

- **Cantidad**: la grilla es pareja (4 columnas en compu, 2 en celular). Para que forme
  un rectángulo completo, usá múltiplos de 4: 4, 8, 12…
- **Orden**: por el número del nombre (`01-...`, `02-...`), aunque estén en subcarpetas distintas.
- **Descripción** (accesibilidad y Google): sale del nombre, sin el número.
  `03-piloto-en-la-ventana.jpg` → «Desobediente, foto de modelaje: piloto en la ventana».
- **Crédito del fotógrafo**: poné la foto en una subcarpeta con su nombre
  (`ivo-barrios/`, `dado-producciones/`). Para sumar otro fotógrafo, agregalo en
  `src/data/galerias.ts` → `fotografos`.
- Formatos: `.jpg`, `.png`, `.webp` o `.avif`, en la mayor resolución posible.
