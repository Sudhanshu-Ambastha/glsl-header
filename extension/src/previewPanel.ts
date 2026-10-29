import * as vscode from "vscode";
// @ts-ignore
import { GLSLHParser } from "glslh/parser";

export class ShaderPreviewPanel {
  public static currentPanel: ShaderPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
  ) {
    const column = vscode.ViewColumn.Beside;

    if (ShaderPreviewPanel.currentPanel) {
      ShaderPreviewPanel.currentPanel._panel.reveal(column);
      ShaderPreviewPanel.currentPanel.update(document);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "glslhPreview",
      `GLSLH Preview: ${document.fileName.split(/[\\/]/).pop()}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      },
    );

    ShaderPreviewPanel.currentPanel = new ShaderPreviewPanel(
      panel,
      extensionUri,
      document,
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    this.update(document);

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private async _fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  private async _resolveInclude(
    rawPath: string,
    document: vscode.TextDocument,
    importerUri: vscode.Uri = document.uri,
  ): Promise<vscode.Uri> {
    const cleanPath = rawPath.trim();

    // 0. If the path is ALREADY an absolute path or URI (e.g. C:/... or file:///...), handle it directly
    if (
      cleanPath.match(/^[a-zA-Z]:[/\\]/) ||
      cleanPath.startsWith("file://") ||
      cleanPath.startsWith("/")
    ) {
      // If it starts with a slash but is a Windows absolute path representation or absolute URI
      const targetUri = cleanPath.startsWith("file://")
        ? vscode.Uri.parse(cleanPath)
        : vscode.Uri.file(cleanPath);

      if (await this._fileExists(targetUri)) {
        return targetUri;
      }
    }

    const sub = cleanPath.replace(/^\.?\//, "");
    const candidates: vscode.Uri[] = [];

    // 1. Relative to the file performing the include
    const importerDir = vscode.Uri.joinPath(importerUri, "..");
    candidates.push(vscode.Uri.joinPath(importerDir, sub));

    // 2. Relative to workspace root
    const ws = vscode.workspace.getWorkspaceFolder(document.uri);
    if (ws) {
      candidates.push(vscode.Uri.joinPath(ws.uri, sub));
    }

    // 3. Walk up parent folders to handle overlapping workspace roots
    let dir = importerDir;
    for (let i = 0; i < 10; i++) {
      candidates.push(vscode.Uri.joinPath(dir, sub));
      const parent = vscode.Uri.joinPath(dir, "..");
      if (parent.path === dir.path) break;
      dir = parent;
    }

    for (const uri of candidates) {
      if (await this._fileExists(uri)) return uri;
    }

    throw new Error(
      `Could not resolve include "${rawPath}". Tried:\n` +
        candidates.map((c) => "  " + c.path).join("\n"),
    );
  }

  public async update(document: vscode.TextDocument) {
    const rawCode = document.getText();
    const fileName = document.fileName.split(/[\\/]/).pop() || "Shader";

    const parser = new GLSLHParser(
      async (filePath: string, importerPath?: string) => {
        try {
          const importerUri = importerPath
            ? document.uri.with({ path: importerPath })
            : document.uri;
          const uri = await this._resolveInclude(
            filePath,
            document,
            importerUri,
          );
          const fileData = await vscode.workspace.fs.readFile(uri);
          return new TextDecoder().decode(fileData);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(
            `Could not resolve include file: "${filePath}" -> Reason: ${message}`,
          );
        }
      },
    );

    let processedCode = rawCode;
    let preprocessError = "";
    try {
      const parsedModule = await parser.parse(rawCode, document.uri.path);
      processedCode = parsedModule.source;
    } catch (e) {
      preprocessError = e instanceof Error ? e.message : String(e);
      console.error("glslh preprocessing error:", preprocessError);
    }

    this._panel.webview.html = this._getHtmlForWebview(
      processedCode,
      fileName,
      preprocessError,
    );
  }

  public dispose() {
    ShaderPreviewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _getHtmlForWebview(
    shaderSource: string,
    title: string,
    preprocessError: string,
  ): string {
    const sanitizedCode = shaderSource
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    const initialErrorDisplay = preprocessError ? "block" : "none";
    const initialErrorText = preprocessError
      ? `Preprocessing Error: ${preprocessError}`
      : "";

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!-- CRITICAL: Explicitly allow unpkg.com for Three.js and unsafe-inline for scripts/styles -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline' https://unpkg.com; connect-src https://unpkg.com;">
            <title>${title}</title>
            <style>
                body, html {
                    margin: 0; padding: 0; width: 100%; height: 100%;
                    overflow: hidden; background-color: #0b0b0e; color: #fff;
                    font-family: system-ui, -apple-system, sans-serif;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                }
                .badge {
                    position: absolute; top: 16px; left: 16px;
                    background: rgba(15, 15, 20, 0.75); padding: 6px 14px;
                    border-radius: 6px; font-size: 12px; border: 1px solid rgba(255,255,255,0.1);
                    backdrop-filter: blur(4px); letter-spacing: 0.5px; pointer-events: none;
                }
                #error-box {
                    position: absolute; bottom: 16px; left: 16px; right: 16px;
                    background: rgba(200, 30, 30, 0.85); padding: 12px; border-radius: 6px;
                    font-size: 12px; font-family: monospace; display: ${initialErrorDisplay}; max-height: 150px; overflow-y: auto;
                    z-index: 10; white-space: pre-wrap;
                }
                canvas {
                    width: 100vw !important; height: 100vh !important; display: block;
                }
            </style>
            <script type="importmap">
                {
                    "imports": {
                        "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
                    }
                }
            </script>
        </head>
        <body>
            <div class="badge">⚡ glslh live runner: ${title}</div>
            <div id="error-box">${initialErrorText}</div>
            <div id="canvas-container"></div>

            <script>
                // Catch silent loading or runtime errors and display them visually
                window.onerror = function(msg, url, line) {
                    const box = document.getElementById('error-box');
                    box.style.display = 'block';
                    box.innerText = "Runtime Error: " + msg + " (Line: " + line + ")";
                };
            </script>

            <script type="module">
                import * as THREE from 'three';

                const container = document.getElementById('canvas-container');
                const renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                container.appendChild(renderer.domElement);

                const scene = new THREE.Scene();
                const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

                const vertexShader = \`
                    void main() {
                        gl_Position = vec4(position, 1.0);
                    }
                \`;

                const fragmentShader = \`${sanitizedCode}\`;

                const uniforms = {
                    u_time: { value: 0.0 },
                    u_intensity: { value: 1.0 },
                    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
                };

                try {
                    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
                    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
                    scene.add(mesh);
                } catch(err) {
                    const box = document.getElementById('error-box');
                    box.style.display = 'block';
                    box.innerText = "Shader Compilation Error: " + err.message;
                }

                const clock = new THREE.Clock();
                function animate() {
                    requestAnimationFrame(animate);
                    uniforms.u_time.value = clock.getElapsedTime();
                    renderer.render(scene, camera);
                }
                animate();

                window.addEventListener('resize', () => {
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
                });
            </script>
        </body>
        </html>`;
  }
}
