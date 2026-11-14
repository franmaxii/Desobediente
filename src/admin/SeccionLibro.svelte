<script lang="ts">
  import { contenido } from './estado.svelte';
  import Campo from './Campo.svelte';
  import CampoImagen from './CampoImagen.svelte';

  let { errores }: { errores: Map<string, string> } = $props();
  const l = $derived(contenido.sitio.libro);
  const e = (clave: string) => errores.get(`sitio.libro.${clave}`);
</script>

<section class="editor">
  <header class="editor-cabeza"><h1>Libro</h1></header>
  <div class="tarjeta">
    <div class="fila-campos fila-campos-medios">
      <CampoImagen etiqueta="Tapa" bind:ruta={l.portada} carpeta="libro" forma="vertical" error={e('portada')} />
      <div>
        <Campo etiqueta="Título" bind:valor={l.titulo} max={120} error={e('titulo')} />
        <Campo etiqueta="Estado" bind:valor={l.estado} max={60} ayuda="Ej.: Libro · En curso · Wattpad" error={e('estado')} />
        <Campo etiqueta="Link para leerlo" tipo="url" bind:valor={l.url} error={e('url')} />
      </div>
    </div>
    <Campo etiqueta="Pregunta de arriba" tipo="parrafo" filas={3} bind:valor={l.pregunta} max={400} error={e('pregunta')} />
    <Campo etiqueta="De qué trata" tipo="parrafo" filas={5} bind:valor={l.sinopsis} max={1200} error={e('sinopsis')} />
    <Campo etiqueta="Cita del libro" tipo="parrafo" filas={2} bind:valor={l.cita.texto} max={400} error={e('cita.texto')} />
    <Campo
      etiqueta="De dónde es la cita"
      bind:valor={l.cita.fuente}
      max={200}
      ayuda="Para un link escribí [texto](https://…) o, a otra parte de la página, [texto](#ep)."
      error={e('cita.fuente')}
    />
  </div>
</section>
