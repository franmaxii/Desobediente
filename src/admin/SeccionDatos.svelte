<script lang="ts">
  import { contenido } from './estado.svelte';
  import Campo from './Campo.svelte';

  let { errores }: { errores: Map<string, string> } = $props();
  const a = $derived(contenido.sitio.artista);
  const e = (clave: string) => errores.get(`sitio.artista.${clave}`);

  const lista = (valores: readonly string[]) => valores.join(', ');
  const separar = (texto: string) =>
    texto
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
</script>

<section class="editor">
  <header class="editor-cabeza"><h1>Datos y Google</h1></header>

  <h2 class="subtitulo">Cómo aparece en Google</h2>
  <div class="tarjeta">
    <div class="google">
      <span class="google-url">desobediente.franmaxi.lol</span>
      <span class="google-titulo">{a.titulo}</span>
      <span class="google-texto">{a.descripcion}</span>
    </div>
    <Campo etiqueta="Título en Google y en la pestaña" bind:valor={a.titulo} max={70} ayuda="Que empiece con «Desobediente 13», que es como la buscan." error={e('titulo')} />
    <Campo etiqueta="Descripción en Google" tipo="parrafo" filas={3} bind:valor={a.descripcion} max={170} error={e('descripcion')} />
    <label class="campo">
      <span class="campo-etiqueta">Otros nombres con los que la buscan</span>
      <input type="text" value={lista(a.alias)} onchange={(ev) => (a.alias = separar(ev.currentTarget.value))} />
      <span class="campo-ayuda">Separados por coma. Solo los lee Google, no se ven en la página.</span>
    </label>
  </div>

  <h2 class="subtitulo">Datos de ella</h2>
  <div class="tarjeta">
    <div class="fila-campos">
      <Campo etiqueta="Nombre artístico" bind:valor={a.nombre} max={40} error={e('nombre')} />
      <Campo etiqueta="Nombre real" bind:valor={a.nombreReal} max={80} error={e('nombreReal')} />
      <Campo etiqueta="De dónde es" bind:valor={a.origen} max={80} error={e('origen')} />
    </div>
    <div class="fila-campos">
      <Campo etiqueta="Fecha de nacimiento" tipo="fecha" bind:valor={a.nacimiento.fecha} error={e('nacimiento.fecha')} />
      <Campo etiqueta="Barrio" bind:valor={a.nacimiento.barrio} max={60} error={e('nacimiento.barrio')} />
      <Campo etiqueta="Ciudad" bind:valor={a.nacimiento.ciudad} max={60} error={e('nacimiento.ciudad')} />
    </div>
    <label class="campo">
      <span class="campo-etiqueta">Oficios</span>
      <input type="text" value={lista(a.oficios)} onchange={(ev) => (a.oficios = separar(ev.currentTarget.value))} />
      <span class="campo-ayuda">Separados por coma.</span>
    </label>
  </div>
</section>
