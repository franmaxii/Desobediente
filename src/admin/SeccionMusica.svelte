<script lang="ts">
  import { contenido } from './estado.svelte';
  import { mover } from './ordenable';
  import Campo from './Campo.svelte';
  import CampoImagen from './CampoImagen.svelte';
  import CampoAudio from './CampoAudio.svelte';
  import CampoVideo from './CampoVideo.svelte';
  import Controles from './Controles.svelte';

  let { errores }: { errores: Map<string, string> } = $props();
  const s = $derived(contenido.sitio);
  const e = (clave: string) => errores.get(`sitio.${clave}`);
  const hoy = () => new Date().toISOString().slice(0, 10);

  const AYUDA_LINKS = 'Para un link escribí [texto](https://…) o, a otra parte de la página, [texto](#libro).';
</script>

<section class="editor">
  <header class="editor-cabeza"><h1>Música</h1></header>

  <h2 class="subtitulo">Canción destacada</h2>
  <p class="editor-ayuda">La que suena en el reproductor de la página.</p>
  <div class="tarjeta">
    <div class="fila-campos">
      <Campo etiqueta="Nombre de la canción" bind:valor={s.single.titulo} max={60} error={e('single.titulo')} />
      <Campo etiqueta="Etiqueta" bind:valor={s.single.etiqueta} max={60} ayuda="Ej.: Single · Parte 1 del EP" error={e('single.etiqueta')} />
    </div>
    <Campo etiqueta="Texto" tipo="parrafo" bind:valor={s.single.texto} max={500} error={e('single.texto')} />
    <div class="fila-campos">
      <Campo etiqueta="Fecha de salida" tipo="fecha" bind:valor={s.single.fecha} error={e('single.fecha')} />
      <Campo etiqueta="Sello" bind:valor={s.single.sello} max={60} error={e('single.sello')} />
      <Campo etiqueta="Género" bind:valor={s.single.genero} max={40} error={e('single.genero')} />
      <Campo etiqueta="ISRC (opcional)" bind:valor={s.single.isrc} max={20} error={e('single.isrc')} />
    </div>
    <div class="fila-campos fila-campos-medios">
      <CampoImagen etiqueta="Portada" bind:ruta={s.single.portada} carpeta="musica" forma="cuadrada" error={e('single.portada')} />
      <CampoAudio bind:ruta={s.single.audio} bind:duracion={s.single.duracionSeg} error={e('single.audio')} />
    </div>
  </div>

  <h2 class="subtitulo">EP</h2>
  <div class="tarjeta">
    <div class="fila-campos">
      <Campo etiqueta="Título de la sección" bind:valor={s.ep.titulo} max={80} error={e('ep.titulo')} />
      <Campo etiqueta="Año" tipo="numero" bind:valor={s.ep.anio} error={e('ep.anio')} />
    </div>
    <Campo etiqueta="Bajada" tipo="parrafo" filas={2} bind:valor={s.ep.bajada} max={300} error={e('ep.bajada')} />
  </div>
  {#each s.ep.partes as parte, i (i)}
    <div class="tarjeta">
      <div class="tarjeta-cabeza">
        <strong>{parte.parte || `Parte ${i + 1}`} · {parte.titulo || 'Sin título'}</strong>
        <Controles indice={i} total={s.ep.partes.length} queEs="parte" alMover={(a, b) => mover(s.ep.partes, a, b)} alBorrar={() => s.ep.partes.splice(i, 1)} />
      </div>
      <div class="fila-campos">
        <Campo etiqueta="Parte" bind:valor={parte.parte} max={40} error={e(`ep.partes.${i}.parte`)} />
        <Campo etiqueta="Título" bind:valor={parte.titulo} max={80} error={e(`ep.partes.${i}.titulo`)} />
        <Campo etiqueta="Fecha" tipo="fecha" bind:valor={parte.fecha} error={e(`ep.partes.${i}.fecha`)} />
      </div>
      <CampoVideo bind:youtubeId={parte.youtubeId} bind:miniatura={parte.miniatura} error={e(`ep.partes.${i}.youtubeId`) ?? e(`ep.partes.${i}.miniatura`)} />
      <Campo etiqueta="Texto" tipo="parrafo" filas={2} bind:valor={parte.texto} max={400} ayuda={AYUDA_LINKS} error={e(`ep.partes.${i}.texto`)} />
    </div>
  {/each}
  <button
    type="button"
    class="boton"
    onclick={() =>
      s.ep.partes.push({ parte: `Parte ${s.ep.partes.length + 1}`, titulo: '', youtubeId: '', fecha: hoy(), miniatura: '', texto: '' })}
    >+ Agregar parte del EP</button
  >

  <h2 class="subtitulo">Videoclips</h2>
  <div class="tarjeta">
    <Campo etiqueta="Título de la sección" bind:valor={s.videoclips.titulo} max={60} error={e('videoclips.titulo')} />
  </div>
  <button
    type="button"
    class="boton"
    onclick={() => s.videoclips.items.unshift({ titulo: '', youtubeId: '', fecha: hoy(), miniatura: '', texto: '' })}
    >+ Agregar videoclip (arriba de todo)</button
  >
  {#each s.videoclips.items as video, i (i)}
    <div class="tarjeta">
      <div class="tarjeta-cabeza">
        <strong>{i + 1}. {video.titulo || 'Videoclip nuevo'}</strong>
        <Controles indice={i} total={s.videoclips.items.length} queEs="videoclip" alMover={(a, b) => mover(s.videoclips.items, a, b)} alBorrar={() => s.videoclips.items.splice(i, 1)} />
      </div>
      <div class="fila-campos">
        <Campo etiqueta="Título" bind:valor={video.titulo} max={80} error={e(`videoclips.items.${i}.titulo`)} />
        <Campo etiqueta="Fecha" tipo="fecha" bind:valor={video.fecha} error={e(`videoclips.items.${i}.fecha`)} />
      </div>
      <CampoVideo bind:youtubeId={video.youtubeId} bind:miniatura={video.miniatura} error={e(`videoclips.items.${i}.youtubeId`) ?? e(`videoclips.items.${i}.miniatura`)} />
      <Campo etiqueta="Texto" tipo="parrafo" filas={2} bind:valor={video.texto} max={400} ayuda={AYUDA_LINKS} error={e(`videoclips.items.${i}.texto`)} />
    </div>
  {/each}
</section>
