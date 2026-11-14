<script lang="ts">
  import { onMount } from 'svelte';
  import './admin.css';
  import { app, contenido, instantanea } from './estado.svelte';
  import * as api from './api';
  import { validar } from './validacion';
  import { archivosUsados } from '../content/esquema';
  import EditorGaleria from './EditorGaleria.svelte';
  import SeccionInicio from './SeccionInicio.svelte';
  import SeccionMusica from './SeccionMusica.svelte';
  import SeccionActriz from './SeccionActriz.svelte';
  import SeccionLibro from './SeccionLibro.svelte';
  import SeccionBio from './SeccionBio.svelte';
  import SeccionRedes from './SeccionRedes.svelte';
  import SeccionDatos from './SeccionDatos.svelte';
  import Ingresar from './Ingresar.svelte';

  /** Si hay que pedir usuario y contraseña: en pantalla completa o en una ventana (sin perder cambios). */
  let pedirEntrada = $state<'no' | 'pantalla' | 'ventana'>('no');
  let dialogoEntrar: HTMLDialogElement;
  const sinSesion = (e: unknown) => e instanceof api.ErrorPanel && e.estado === 401;

  function sesionVencida() {
    pedirEntrada = 'ventana';
    queueMicrotask(() => dialogoEntrar?.showModal());
  }

  async function salirDelPanel() {
    if (hayCambios && !confirm('Tenés cambios sin publicar. Si salís, se pierden. ¿Salir igual?')) return;
    await api.salir();
    if (app.email.includes('@')) location.href = '/cdn-cgi/access/logout';
    else location.reload();
  }

  type SeccionId = 'modelo' | 'en-vivo' | 'inicio' | 'musica' | 'actriz' | 'libro' | 'bio' | 'redes' | 'datos';
  const SECCIONES: { id: SeccionId; nombre: string; icono: string; claves: string[] }[] = [
    { id: 'modelo', nombre: 'Fotos de modelo', icono: '📸', claves: ['galerias.galerias.modelo', 'galerias.fotografos'] },
    { id: 'en-vivo', nombre: 'Fotos en vivo', icono: '🎤', claves: ['galerias.galerias.en-vivo'] },
    { id: 'inicio', nombre: 'Inicio', icono: '🏠', claves: ['sitio.inicio', 'sitio.artista.lema'] },
    { id: 'musica', nombre: 'Música', icono: '🎵', claves: ['sitio.single', 'sitio.ep', 'sitio.videoclips'] },
    { id: 'actriz', nombre: 'Actriz', icono: '🎬', claves: ['sitio.actriz'] },
    { id: 'libro', nombre: 'Libro', icono: '📖', claves: ['sitio.libro'] },
    { id: 'bio', nombre: 'Bio', icono: '✍️', claves: ['sitio.bio', 'sitio.artista.sueno'] },
    { id: 'redes', nombre: 'Redes', icono: '🔗', claves: ['sitio.redes'] },
    { id: 'datos', nombre: 'Datos y Google', icono: '🔎', claves: ['sitio.artista'] },
  ];

  /** A qué sección pertenece una clave (la más específica gana). */
  function seccionDe(clave: string): SeccionId {
    let mejor: { id: SeccionId; largo: number } = { id: 'datos', largo: 0 };
    for (const s of SECCIONES) {
      for (const c of s.claves) {
        if ((clave === c || clave.startsWith(`${c}.`)) && c.length > mejor.largo) mejor = { id: s.id, largo: c.length };
      }
    }
    return mejor.id;
  }

  const inicial = location.hash.slice(1) as SeccionId;
  let seccion = $state<SeccionId>(SECCIONES.some((s) => s.id === inicial) ? inicial : 'modelo');
  let menuAbierto = $state(false);

  function ir(id: SeccionId) {
    seccion = id;
    menuAbierto = false;
    history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0 });
  }

  const actual = $derived(app.cargado ? instantanea() : '');
  const hayCambios = $derived(app.cargado && actual !== app.original);
  const validacion = $derived(
    app.cargado
      ? validar($state.snapshot(contenido.sitio), $state.snapshot(contenido.galerias))
      : { mapa: new Map<string, string>(), lista: [] },
  );

  /** Secciones con cambios sin publicar. */
  const cambiadas = $derived.by(() => {
    if (!hayCambios) return new Set<SeccionId>();
    const antes = JSON.parse(app.original);
    const ahora = JSON.parse(actual);
    const leer = (obj: unknown, clave: string) =>
      clave.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);
    const resultado = new Set<SeccionId>();
    for (const s of SECCIONES) {
      if (s.claves.some((c) => JSON.stringify(leer(antes, c)) !== JSON.stringify(leer(ahora, c)))) resultado.add(s.id);
    }
    return resultado;
  });
  const conErrores = $derived(new Set(validacion.lista.map((p) => seccionDe(p.clave))));

  async function cargar() {
    try {
      const datos = await api.cargar();
      contenido.sitio = datos.sitio;
      contenido.galerias = datos.galerias;
      app.base = datos.commit;
      app.email = datos.email;
      app.original = instantanea();
      app.error = '';
      app.cargado = true;
      pedirEntrada = 'no';
    } catch (e) {
      if (sinSesion(e)) pedirEntrada = 'pantalla';
      else app.error = e instanceof Error ? e.message : 'No se pudo cargar el panel.';
    }
  }

  onMount(() => {
    cargar();
    const avisar = (e: BeforeUnloadEvent) => {
      if (hayCambios) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  });

  function descartar() {
    if (!confirm('¿Descartar todos los cambios que no publicaste?')) return;
    const original = JSON.parse(app.original);
    contenido.sitio = original.sitio;
    contenido.galerias = original.galerias;
  }

  // ---------- publicar ----------
  type Paso = 'subiendo' | 'guardando' | 'construyendo' | 'listo' | 'tarda' | 'error';
  let publicacion = $state<{ paso: Paso; hechos: number; total: number; error?: string; detalle?: string } | null>(null);
  let dialogoPublicar: HTMLDialogElement;
  let cancelarEspera = false;

  async function esperar(commit: string) {
    publicacion = { paso: 'construyendo', hechos: 0, total: 0 };
    cancelarEspera = false;
    const listo = await api.esperarPublicacion(commit, () => cancelarEspera);
    if (publicacion) publicacion.paso = listo ? 'listo' : 'tarda';
  }

  async function publicar() {
    if (validacion.lista.length) return;
    publicacion = { paso: 'subiendo', hechos: 0, total: 0 };
    dialogoPublicar.showModal();
    try {
      const sitio = $state.snapshot(contenido.sitio);
      const galerias = $state.snapshot(contenido.galerias);
      const usados = new Set(archivosUsados(sitio, galerias));

      const pendientes = Object.entries(app.subidas).filter(([ruta, s]) => usados.has(ruta) && !s.sha && s.blob);
      publicacion.total = pendientes.length;
      for (const [, subida] of pendientes) {
        subida.sha = await api.subirArchivo(subida.blob!);
        publicacion.hechos++;
      }

      publicacion.paso = 'guardando';
      const nuevos = Object.entries(app.subidas)
        .filter(([ruta, s]) => usados.has(ruta) && s.sha)
        .map(([ruta, s]) => ({ ruta: `src/assets/${ruta}`, sha: s.sha! }));
      const nombres = SECCIONES.filter((s) => cambiadas.has(s.id)).map((s) => s.nombre);
      const r = await api.publicar({
        base: app.base,
        sitio,
        galerias,
        nuevos,
        resumen: nombres.length ? `cambios en ${nombres.join(', ')}` : 'actualiza el contenido',
      });
      app.base = r.commit;
      app.original = instantanea();
      if (r.sinCambios) {
        publicacion.paso = 'listo';
        return;
      }
      await esperar(r.commit);
    } catch (e) {
      if (sinSesion(e)) {
        cerrarPublicacion();
        sesionVencida();
        return;
      }
      publicacion = {
        paso: 'error',
        hechos: 0,
        total: 0,
        error: e instanceof Error ? e.message : 'No se pudo publicar.',
        detalle: e instanceof api.ErrorPanel ? e.detalle : undefined,
      };
    }
  }

  function cerrarPublicacion() {
    cancelarEspera = true;
    dialogoPublicar.close();
    publicacion = null;
  }

  // ---------- historial ----------
  let dialogoHistorial: HTMLDialogElement;
  let versiones = $state<{ commit: string; fecha: string; mensaje: string; delPanel: boolean }[] | null>(null);
  let problemaHistorial = $state('');

  async function abrirHistorial() {
    versiones = null;
    problemaHistorial = '';
    dialogoHistorial.showModal();
    try {
      versiones = (await api.historial()).versiones;
    } catch (e) {
      if (sinSesion(e)) {
        dialogoHistorial.close();
        sesionVencida();
        return;
      }
      problemaHistorial = e instanceof Error ? e.message : 'No se pudo cargar el historial.';
    }
  }

  const fechaLinda = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' });

  async function volverA(v: { commit: string; fecha: string }) {
    const aviso = hayCambios ? '\n\nOjo: vas a perder los cambios que no publicaste.' : '';
    if (!confirm(`¿Dejar la página como estaba el ${fechaLinda(v.fecha)}?${aviso}`)) return;
    try {
      const r = await api.restaurar(v.commit, v.fecha);
      dialogoHistorial.close();
      await cargar();
      dialogoPublicar.showModal();
      await esperar(r.commit);
    } catch (e) {
      problemaHistorial = e instanceof Error ? e.message : 'No se pudo volver a esa versión.';
    }
  }
</script>

{#if !app.cargado}
  <div class="pantalla-centro">
    {#if pedirEntrada === 'pantalla'}
      <Ingresar alEntrar={cargar} />
    {:else if app.error}
      <p class="logo-grande">desobediente</p>
      <p class="aviso aviso-error">{app.error}</p>
      <button type="button" class="boton boton-primario" onclick={() => location.reload()}>Reintentar</button>
    {:else}
      <p class="logo-grande">desobediente</p>
      <p class="cargando">Cargando el panel…</p>
    {/if}
  </div>
{:else}
  <div class="panel">
    <header class="barra">
      <button type="button" class="barra-menu" aria-label="Secciones" aria-expanded={menuAbierto} onclick={() => (menuAbierto = !menuAbierto)}>☰</button>
      <a class="barra-logo" href="/" target="_blank" rel="noopener" title="Ver la página">desobediente <span>panel</span></a>
      <span class={hayCambios ? 'pildora pildora-cambios' : 'pildora'}>
        {hayCambios ? 'Cambios sin publicar' : 'Todo publicado'}
      </span>
      <div class="barra-acciones">
        <button type="button" class="boton boton-texto" onclick={abrirHistorial}>Historial</button>
        {#if hayCambios}<button type="button" class="boton boton-texto" onclick={descartar}>Descartar</button>{/if}
        <button
          type="button"
          class="boton boton-primario"
          disabled={!hayCambios || validacion.lista.length > 0}
          title={validacion.lista.length ? 'Primero corregí lo que está marcado' : ''}
          onclick={publicar}>Publicar</button
        >
      </div>
    </header>

    <nav class="menu" class:abierto={menuAbierto} aria-label="Secciones del panel">
      {#each SECCIONES as s}
        <button type="button" class="menu-item" class:activo={seccion === s.id} aria-current={seccion === s.id ? 'page' : undefined} onclick={() => ir(s.id)}>
          <span class="menu-icono" aria-hidden="true">{s.icono}</span>
          <span class="menu-nombre">{s.nombre}</span>
          {#if conErrores.has(s.id)}<span class="menu-marca error" title="Hay algo para corregir">!</span>
          {:else if cambiadas.has(s.id)}<span class="menu-marca" title="Con cambios sin publicar"></span>{/if}
        </button>
      {/each}
      <div class="menu-pie">
        <button type="button" class="boton" onclick={() => { menuAbierto = false; abrirHistorial(); }}>Historial de versiones</button>
        <span>Entraste como<br /><strong>{app.email}</strong></span>
        <button type="button" class="boton-link" onclick={salirDelPanel}>Salir</button>
      </div>
    </nav>

    <main class="contenido">
      {#if hayCambios && !validacion.lista.length}
        <p class="aviso aviso-info">Los cambios todavía no se ven en la página. Cuando termines, tocá <strong>Publicar</strong>.</p>
      {/if}
      {#if validacion.lista.length}
        <div class="aviso aviso-error">
          <strong>Antes de publicar, revisá:</strong>
          <ul>
            {#each validacion.lista.slice(0, 8) as p}
              <li>
                {p.texto}
                {#if seccionDe(p.clave) !== seccion}
                  <button type="button" class="boton-link" onclick={() => ir(seccionDe(p.clave))}>ir</button>
                {/if}
              </li>
            {/each}
          </ul>
          {#if validacion.lista.length > 8}<p>…y {validacion.lista.length - 8} más.</p>{/if}
        </div>
      {/if}

      {#if seccion === 'modelo'}<EditorGaleria id="modelo" errores={validacion.mapa} />
      {:else if seccion === 'en-vivo'}<EditorGaleria id="en-vivo" errores={validacion.mapa} />
      {:else if seccion === 'inicio'}<SeccionInicio errores={validacion.mapa} />
      {:else if seccion === 'musica'}<SeccionMusica errores={validacion.mapa} />
      {:else if seccion === 'actriz'}<SeccionActriz errores={validacion.mapa} />
      {:else if seccion === 'libro'}<SeccionLibro errores={validacion.mapa} />
      {:else if seccion === 'bio'}<SeccionBio errores={validacion.mapa} />
      {:else if seccion === 'redes'}<SeccionRedes errores={validacion.mapa} />
      {:else}<SeccionDatos errores={validacion.mapa} />{/if}
    </main>
  </div>
{/if}

<dialog bind:this={dialogoPublicar} class="modal modal-publicar" oncancel={(e) => { if (publicacion && ['subiendo', 'guardando'].includes(publicacion.paso)) e.preventDefault(); }}>
  {#if publicacion}
    {@const p = publicacion}
    {#if p.paso === 'error'}
      <h2>No se pudo publicar</h2>
      <p>{p.error}</p>
      {#if p.detalle}<pre class="detalle">{p.detalle}</pre>{/if}
      <p class="editor-ayuda">La página sigue como estaba. Tus cambios siguen acá en el panel.</p>
      <button type="button" class="boton boton-primario" onclick={cerrarPublicacion}>Entendido</button>
    {:else}
      <h2>{p.paso === 'listo' ? '¡Listo!' : p.paso === 'tarda' ? 'Está tardando un poco' : 'Publicando…'}</h2>
      <ol class="pasos">
        <li class:hecho={p.paso !== 'subiendo'} class:activo={p.paso === 'subiendo'}>
          Subiendo fotos{p.total ? ` (${p.hechos} de ${p.total})` : ''}
        </li>
        <li class:hecho={['construyendo', 'listo', 'tarda'].includes(p.paso)} class:activo={p.paso === 'guardando'}>Guardando cambios</li>
        <li class:hecho={p.paso === 'listo'} class:activo={p.paso === 'construyendo' || p.paso === 'tarda'}>
          Actualizando la página (tarda 1 o 2 minutos)
        </li>
      </ol>
      {#if p.paso === 'listo'}
        <p>Los cambios ya están en la página.</p>
        <div class="fila-acciones">
          <a class="boton boton-primario" href="/" target="_blank" rel="noopener">Ver la página</a>
          <button type="button" class="boton" onclick={cerrarPublicacion}>Seguir editando</button>
        </div>
      {:else if p.paso === 'tarda'}
        <p>Los cambios están guardados, pero la página todavía no se actualizó. Puede tardar unos minutos más; si pasa mucho tiempo, avisale a Franmaxi.</p>
        <button type="button" class="boton" onclick={cerrarPublicacion}>Cerrar</button>
      {:else if p.paso === 'construyendo'}
        <p class="editor-ayuda">Ya está guardado. Podés cerrar esto y seguir editando mientras se actualiza.</p>
        <button type="button" class="boton" onclick={cerrarPublicacion}>Seguir editando</button>
      {/if}
    {/if}
  {/if}
</dialog>

<dialog bind:this={dialogoHistorial} class="modal modal-historial">
  <h2>Historial</h2>
  <p class="editor-ayuda">Cada vez que se publica queda guardada una versión. Podés volver a cualquiera.</p>
  {#if problemaHistorial}<p class="aviso aviso-error">{problemaHistorial}</p>{/if}
  {#if !versiones && !problemaHistorial}
    <p class="cargando">Cargando…</p>
  {:else if versiones}
    <ol class="historial">
      {#each versiones as v, i}
        <li>
          <div>
            <strong>{fechaLinda(v.fecha)}</strong>
            <span>{v.mensaje}</span>
          </div>
          {#if i === 0}
            <span class="pildora">Actual</span>
          {:else}
            <button type="button" class="boton" onclick={() => volverA(v)}>Volver a esta</button>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
  <button type="button" class="boton" onclick={() => dialogoHistorial.close()}>Cerrar</button>
</dialog>

<dialog bind:this={dialogoEntrar} class="modal" oncancel={(e) => e.preventDefault()}>
  {#if pedirEntrada === 'ventana'}
    <Ingresar
      aviso="Tu sesión venció. Entrá de nuevo: tus cambios siguen acá. Después volvé a tocar Publicar."
      alEntrar={() => {
        dialogoEntrar.close();
        pedirEntrada = 'no';
      }}
    />
  {/if}
</dialog>
