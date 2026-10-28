import * as vscode from "vscode";
// @ts-ignore
import { GLSLHParser } from "glslh/src/parser.js";

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

  public async update(document: vscode.TextDocument) {
    const rawCode = document.getText();
    const fileName = document.fileName.split(/[\\/]/).pop() || "Shader";

    // Use glslh parser with a custom file resolver that handles VS Code workspace documents!
    const parser = new GLSLHParser(async (filePath: string) => {
      try {
        // Resolve relative paths based on the current document's URI
        const currentUri = document.uri;
        const resolvedUri = vscode.Uri.joinPath(currentUri, "..", filePath);
        const fileData = await vscode.workspace.fs.readFile(resolvedUri);
        return new TextDecoder().decode(fileData);
      } catch (err) {
        throw new Error(`Could not resolve include file: ${filePath}`);
      }
    });

    let processedCode = rawCode;
    try {
      const parsedModule = await parser.parse(rawCode, document.uri.path);
      processedCode = parsedModule.source;
    } catch (e) {
      console.error("glslh preprocessing error:", e);
    }

    this._panel.webview.html = this._getHtmlForWebview(processedCode, fileName);
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

  private _getHtmlForWebview(shaderSource: string, title: string): string {
    const sanitizedCode = shaderSource
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                    background: rgba(200, 30, 30, 0.85); padding: 10px; border-radius: 6px;
                    font-size: 11px; font-family: monospace; display: none; max-height: 100px; overflow-y: auto;
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
            <div id="error-box"></div>
            <div id="canvas-container"></div>

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

                let mesh;
                try {
                    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
                    mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
                    scene.add(mesh);
                } catch(err) {
                    showError(err.message);
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

                function showError(msg) {
                    const box = document.getElementById('error-box');
                    box.style.display = 'block';
                    box.innerText = "Shader Error: " + msg;
                }
            </script>
        </body>
        </html>`;
  }
}
