/**
 * Cliente mínimo de la API de GitHub para leer y guardar el contenido del sitio.
 * Cada «Publicar» del panel es un commit en la rama principal → Cloudflare Pages reconstruye el sitio.
 */

export interface EnvGitHub {
  /** Token «fine-grained» con permiso Contents: Read and write, solo para este repo. */
  GITHUB_TOKEN?: string;
  /** «usuario/repo» */
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  /** Solo para pruebas locales (un servidor falso de GitHub). */
  GITHUB_API?: string;
}

export class ErrorGitHub extends Error {
  constructor(
    public estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export interface EntradaArbol {
  path: string;
  mode: '100644';
  type: 'blob';
  sha?: string | null;
  content?: string;
}

export class GitHub {
  private base: string;
  private repo: string;
  private token: string;
  readonly rama: string;

  constructor(env: EnvGitHub) {
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
      throw new ErrorGitHub(500, 'Falta configurar GITHUB_TOKEN y GITHUB_REPO en Cloudflare.');
    }
    this.base = (env.GITHUB_API ?? 'https://api.github.com').replace(/\/+$/, '');
    this.repo = env.GITHUB_REPO;
    this.token = env.GITHUB_TOKEN;
    this.rama = env.GITHUB_BRANCH || 'main';
  }

  async api(ruta: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${this.token}`);
    headers.set('user-agent', 'panel-desobediente');
    headers.set('x-github-api-version', '2022-11-28');
    if (!headers.has('accept')) headers.set('accept', 'application/vnd.github+json');
    return fetch(`${this.base}/repos/${this.repo}${ruta}`, { ...init, headers });
  }

  private async pedirJson<T>(ruta: string, init: RequestInit = {}): Promise<T> {
    const res = await this.api(ruta, init);
    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      throw new ErrorGitHub(res.status, `GitHub respondió ${res.status} en ${ruta}: ${detalle.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  /** Último commit de la rama y su árbol. */
  async cabeza(): Promise<{ commit: string; arbol: string }> {
    const ref = await this.pedirJson<{ object: { sha: string } }>(`/git/ref/heads/${this.rama}`);
    const commit = await this.pedirJson<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`);
    return { commit: ref.object.sha, arbol: commit.tree.sha };
  }

  async arbolDeCommit(commit: string): Promise<string> {
    const c = await this.pedirJson<{ tree: { sha: string } }>(`/git/commits/${commit}`);
    return c.tree.sha;
  }

  /** Todos los archivos del árbol: ruta → sha. */
  async archivos(arbol: string): Promise<Map<string, string>> {
    const datos = await this.pedirJson<{ tree: { path: string; type: string; sha: string }[]; truncated: boolean }>(
      `/git/trees/${arbol}?recursive=1`,
    );
    return new Map(datos.tree.filter((e) => e.type === 'blob').map((e) => [e.path, e.sha]));
  }

  /** Contenido binario de un blob. */
  async blob(sha: string): Promise<Response> {
    const res = await this.api(`/git/blobs/${sha}`, { headers: { accept: 'application/vnd.github.raw+json' } });
    if (!res.ok) throw new ErrorGitHub(res.status, `No se pudo leer el archivo (${res.status})`);
    return res;
  }

  async textoDeBlob(sha: string): Promise<string> {
    return (await this.blob(sha)).text();
  }

  /** Crea un blob a partir de un cuerpo JSON ya armado: {"encoding":"base64","content":"…"}. */
  async crearBlob(cuerpo: BodyInit): Promise<string> {
    const r = await this.pedirJson<{ sha: string }>('/git/blobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: cuerpo,
    });
    return r.sha;
  }

  async crearArbol(base: string, entradas: EntradaArbol[]): Promise<string> {
    const r = await this.pedirJson<{ sha: string }>('/git/trees', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ base_tree: base, tree: entradas }),
    });
    return r.sha;
  }

  async crearCommit(mensaje: string, arbol: string, padre: string): Promise<string> {
    const r = await this.pedirJson<{ sha: string }>('/git/commits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: mensaje, tree: arbol, parents: [padre] }),
    });
    return r.sha;
  }

  /** Mueve la rama al commit nuevo, solo si avanza (nunca pisa trabajo ajeno). */
  async moverRama(commit: string): Promise<void> {
    const res = await this.api(`/git/refs/heads/${this.rama}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sha: commit, force: false }),
    });
    if (res.status === 422 || res.status === 409) {
      throw new ErrorGitHub(409, 'Hubo otro cambio al mismo tiempo. Recargá el panel y probá de nuevo.');
    }
    if (!res.ok) throw new ErrorGitHub(res.status, `No se pudo publicar (${res.status})`);
  }

  async historial(ruta: string, cantidad = 15) {
    return this.pedirJson<{ sha: string; commit: { message: string; committer: { date: string } } }[]>(
      `/commits?sha=${encodeURIComponent(this.rama)}&path=${encodeURIComponent(ruta)}&per_page=${cantidad}`,
    );
  }
}
