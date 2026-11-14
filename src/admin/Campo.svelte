<script lang="ts">
  /** Un campo de texto con etiqueta, ayuda, contador y error. */
  interface Props {
    etiqueta: string;
    valor: string | number | undefined;
    tipo?: 'texto' | 'parrafo' | 'url' | 'fecha' | 'numero';
    ayuda?: string;
    max?: number;
    error?: string;
    placeholder?: string;
    filas?: number;
  }

  let {
    etiqueta,
    valor = $bindable(),
    tipo = 'texto',
    ayuda = '',
    max = 0,
    error = '',
    placeholder = '',
    filas = 4,
  }: Props = $props();

  const largo = $derived(typeof valor === 'string' ? valor.length : 0);
</script>

<label class="campo" class:con-error={!!error}>
  <span class="campo-etiqueta">
    {etiqueta}
    {#if max && tipo !== 'numero' && tipo !== 'fecha'}
      <span class="campo-contador" class:cerca={largo > max * 0.9}>{largo}/{max}</span>
    {/if}
  </span>
  {#if tipo === 'parrafo'}
    <textarea bind:value={valor} rows={filas} maxlength={max || undefined} {placeholder}></textarea>
  {:else if tipo === 'numero'}
    <input type="number" bind:value={valor} inputmode="numeric" {placeholder} />
  {:else if tipo === 'fecha'}
    <input type="date" bind:value={valor} />
  {:else}
    <input
      type={tipo === 'url' ? 'url' : 'text'}
      bind:value={valor}
      maxlength={max || undefined}
      {placeholder}
      autocomplete="off"
      spellcheck={tipo === 'url' ? false : true}
    />
  {/if}
  {#if error}
    <span class="campo-error">{error}</span>
  {:else if ayuda}
    <span class="campo-ayuda">{ayuda}</span>
  {/if}
</label>
