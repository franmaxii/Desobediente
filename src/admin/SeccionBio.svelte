<script lang="ts">
  import { contenido } from './estado.svelte';
  import { mover } from './ordenable';
  import Campo from './Campo.svelte';
  import Controles from './Controles.svelte';

  let { errores }: { errores: Map<string, string> } = $props();
  const s = $derived(contenido.sitio);
  const e = (clave: string) => errores.get(`sitio.${clave}`);
</script>

<section class="editor">
  <header class="editor-cabeza"><h1>Bio</h1></header>
  <div class="tarjeta">
    <Campo etiqueta="Título de la sección" bind:valor={s.bio.titulo} max={60} error={e('bio.titulo')} />
  </div>

  <h2 class="subtitulo">Texto</h2>
  <p class="editor-ayuda">
    El primer párrafo sale más grande. Para un link escribí [texto](https://…) o, a otra parte de la página,
    [texto](#videoclips).
  </p>
  {#each s.bio.parrafos as _, i (i)}
    <div class="tarjeta">
      <div class="tarjeta-cabeza">
        <strong>Párrafo {i + 1}{i === 0 ? ' (destacado)' : ''}</strong>
        <Controles indice={i} total={s.bio.parrafos.length} queEs="párrafo" alMover={(a, b) => mover(s.bio.parrafos, a, b)} alBorrar={() => s.bio.parrafos.splice(i, 1)} />
      </div>
      <Campo etiqueta="Texto" tipo="parrafo" bind:valor={s.bio.parrafos[i]} max={900} error={e(`bio.parrafos.${i}`)} />
    </div>
  {/each}
  <button type="button" class="boton" onclick={() => s.bio.parrafos.push('')}>+ Agregar párrafo</button>

  <h2 class="subtitulo">Su sueño</h2>
  <div class="tarjeta">
    <Campo etiqueta="Frase (sale grande y en rojo, firmada «— Milena»)" tipo="parrafo" filas={2} bind:valor={s.artista.sueno} max={200} error={e('artista.sueno')} />
  </div>

  <h2 class="subtitulo">Ficha</h2>
  <p class="editor-ayuda">El recuadro con datos al costado de la bio.</p>
  {#each s.bio.ficha as dato, i (i)}
    <div class="fila-campos fila-con-controles">
      <Campo etiqueta="Dato" bind:valor={dato.etiqueta} max={30} error={e(`bio.ficha.${i}.etiqueta`)} />
      <Campo etiqueta="Valor" bind:valor={dato.valor} max={200} error={e(`bio.ficha.${i}.valor`)} />
      <Controles indice={i} total={s.bio.ficha.length} queEs="dato" alMover={(a, b) => mover(s.bio.ficha, a, b)} alBorrar={() => s.bio.ficha.splice(i, 1)} />
    </div>
  {/each}
  <button type="button" class="boton" onclick={() => s.bio.ficha.push({ etiqueta: '', valor: '' })}>+ Agregar dato</button>
</section>
