<script lang="ts">
  import { contenido } from './estado.svelte';
  import { mover } from './ordenable';
  import { REDES, type RedId } from '../content/esquema';
  import Campo from './Campo.svelte';
  import Controles from './Controles.svelte';

  let { errores }: { errores: Map<string, string> } = $props();
  const redes = $derived(contenido.sitio.redes);
  const e = (clave: string) => errores.get(`sitio.redes.${clave}`);

  const NOMBRES: Record<RedId, string> = {
    spotify: 'Spotify',
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitch: 'Twitch',
    wattpad: 'Wattpad',
  };
  const OBLIGATORIAS: RedId[] = ['spotify', 'youtube', 'instagram'];
  const faltantes = $derived(REDES.filter((r) => !redes.some((x) => x.id === r)));
</script>

<section class="editor">
  <header class="editor-cabeza"><h1>Redes</h1></header>
  <p class="editor-ayuda">El orden de acá es el orden en la página. Spotify, YouTube e Instagram no se pueden sacar porque los usan otros botones.</p>
  {#if errores.get('sitio.redes')}<p class="aviso aviso-error">{errores.get('sitio.redes')}</p>{/if}

  {#each redes as red, i (red.id)}
    <div class="tarjeta">
      <div class="tarjeta-cabeza">
        <strong>{NOMBRES[red.id]}</strong>
        {#if OBLIGATORIAS.includes(red.id)}
          <div class="controles">
            <button type="button" class="boton-icono" aria-label="Subir" disabled={i === 0} onclick={() => mover(redes, i, i - 1)}>↑</button>
            <button type="button" class="boton-icono" aria-label="Bajar" disabled={i === redes.length - 1} onclick={() => mover(redes, i, i + 1)}>↓</button>
          </div>
        {:else}
          <Controles indice={i} total={redes.length} queEs="red" alMover={(a, b) => mover(redes, a, b)} alBorrar={() => redes.splice(i, 1)} />
        {/if}
      </div>
      <div class="fila-campos">
        <Campo etiqueta="Link" tipo="url" bind:valor={red.url} error={e(`${i}.url`)} />
        <Campo etiqueta="Usuario como se muestra" bind:valor={red.handle} max={40} error={e(`${i}.handle`)} />
        <Campo etiqueta="Texto chico" bind:valor={red.detalle} max={40} ayuda="Ej.: videoclips, shows y novedades" error={e(`${i}.detalle`)} />
      </div>
    </div>
  {/each}

  {#if faltantes.length}
    <div class="fila-acciones">
      {#each faltantes as id}
        <button type="button" class="boton" onclick={() => redes.push({ id, nombre: NOMBRES[id], url: 'https://', handle: '', detalle: '' })}>
          + {NOMBRES[id]}
        </button>
      {/each}
    </div>
  {/if}
</section>
