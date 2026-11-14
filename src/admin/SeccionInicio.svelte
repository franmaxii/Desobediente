<script lang="ts">
  import { contenido } from './estado.svelte';
  import Campo from './Campo.svelte';
  import CampoImagen from './CampoImagen.svelte';

  let { errores }: { errores: Map<string, string> } = $props();
  const s = $derived(contenido.sitio);
</script>

<section class="editor">
  <header class="editor-cabeza"><h1>Inicio</h1></header>
  <p class="editor-ayuda">Lo primero que se ve al entrar: la foto, el logo encima y la frase de abajo.</p>

  <div class="tarjeta">
    <CampoImagen
      etiqueta="Foto principal"
      bind:ruta={s.inicio.foto}
      carpeta="inicio"
      forma="horizontal"
      ayuda="Se recorta casi cuadrada y se le funde la parte de abajo. Conviene una foto con la cara arriba y centrada."
      error={errores.get('sitio.inicio.foto')}
    />
    <Campo
      etiqueta="Frase debajo del logo"
      tipo="parrafo"
      filas={3}
      bind:valor={s.inicio.bajada}
      max={200}
      error={errores.get('sitio.inicio.bajada')}
    />
    <Campo
      etiqueta="Lema (aparece con la mecha y en el pie de página)"
      bind:valor={s.artista.lema}
      max={120}
      error={errores.get('sitio.artista.lema')}
    />
  </div>
</section>
