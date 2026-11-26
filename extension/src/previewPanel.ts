import * as vscode from "vscode";
// @ts-ignore
import { GLSLHParser, strictIncludePolicy } from "glslh/parser";
import { getPreviewHtml } from "./previewHtml";

interface ShaderPayload {
  type: "loadShader";
  title: string;
  shaderSource: string;
  uniforms: Record<string, any>;
  preprocessError: string;
}

export class ShaderPreviewPanel {
  public static currentPanel: ShaderPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _updateToken = 0;
  private _lastDocument: vscode.TextDocument | undefined;
  private _lastPayload: ShaderPayload | undefined;
  private _webviewReady = false;
  private _updateTimer: ReturnType<typeof setTimeout> | undefined;
  private _settleTimer: ReturnType<typeof setTimeout> | undefined;

  public static createOrShow(
    extensionUri: vscode.Uri,
    document: vscode.TextDocument,
  ) {
    const column = vscode.ViewColumn.Beside;

    if (ShaderPreviewPanel.currentPanel) {
      ShaderPreviewPanel.currentPanel._panel.reveal(column, true);
      ShaderPreviewPanel.currentPanel.scheduleUpdate(document, 1);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "glslhPreview",
      `GLSLH Preview: ${document.fileName.split(/[\\/]/).pop()}`,
      { viewColumn: column, preserveFocus: true },
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
    this._lastDocument = document;

    this._panel.webview.onDidReceiveMessage(
      (msg) => {
        if (!msg || typeof msg !== "object") {return;}
        if (msg.type === "ready") {
          this._webviewReady = true;
          if (this._lastPayload) {
            void this._panel.webview.postMessage(this._lastPayload);
          } else if (this._lastDocument) {
            this.scheduleUpdate(this._lastDocument, 1);
          }
          void this._panel.webview.postMessage({
            type: "setVisible",
            visible: this._panel.visible,
          });
        } else if (msg.type === "requestReload" && this._lastDocument) {
          this.scheduleUpdate(this._lastDocument, 1);
        }
      },
      null,
      this._disposables,
    );

    const initialTitle = document.fileName.split(/[\\/]/).pop() || "Shader";
    this._panel.webview.html = getPreviewHtml(
      initialTitle,
      this._panel.webview.cspSource,
    );

    this._panel.onDidChangeViewState(
      (e) => {
        if (this._webviewReady) {
          void this._panel.webview.postMessage({
            type: "setVisible",
            visible: e.webviewPanel.visible,
          });
          if (e.webviewPanel.visible) {
            void this._panel.webview.postMessage({ type: "resume" });
          }
        }
      },
      null,
      this._disposables,
    );

    this.scheduleUpdate(document, 1);

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public scheduleUpdate(document: vscode.TextDocument, delayMs = 1) {
    this._lastDocument = document;

    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
      this._updateTimer = undefined;
    }
    if (this._settleTimer) {
      clearTimeout(this._settleTimer);
      this._settleTimer = undefined;
    }

    this._updateTimer = setTimeout(
      () => {
        this._updateTimer = undefined;
        void this.update(document);
      },
      Math.max(1, delayMs),
    );

    this._settleTimer = setTimeout(() => {
      this._settleTimer = undefined;
      if (this._webviewReady && this._panel.visible) {
        void this._panel.webview.postMessage({ type: "settleRepaint" });
      }
    }, 1000);
  }

  private _projectRoot(document: vscode.TextDocument): {
    rootUri: vscode.Uri;
    rootKey: string;
  } {
    const ws = vscode.workspace.getWorkspaceFolder(document.uri);
    if (ws) {
      const rel = vscode.workspace
        .asRelativePath(document.uri, false)
        .replace(/\\/g, "/");
      return {
        rootUri: ws.uri,
        rootKey: rel || document.uri.path.split("/").pop() || "shader.glslh",
      };
    }

    return {
      rootUri: vscode.Uri.joinPath(document.uri, ".."),
      rootKey: document.uri.path.split("/").pop() || "shader.glslh",
    };
  }

  public async update(document: vscode.TextDocument) {
    this._lastDocument = document;
    const token = ++this._updateToken;
    const fileName = document.fileName.split(/[\\/]/).pop() || "Shader";
    const { rootUri, rootKey } = this._projectRoot(document);

    const parser = new GLSLHParser(
      async (requestedPath: string) => {
        if (requestedPath === rootKey) {
          return document.getText();
        }
        const uri = vscode.Uri.joinPath(rootUri, requestedPath);
        const open = vscode.workspace.textDocuments.find(
          (d) => d.uri.toString() === uri.toString(),
        );
        if (open) {
          return open.getText();
        }
        try {
          const bytes = await vscode.workspace.fs.readFile(uri);
          return new TextDecoder().decode(bytes);
        } catch {
          throw new Error(
            `Include not found: "${requestedPath}"\n  looked at: ${uri.toString(true)}`,
          );
        }
      },
      undefined,
      { includePolicy: strictIncludePolicy },
    );

    let processedCode = document.getText();
    let uniformsMap: Record<string, any> = {};
    let preprocessError = "";

    try {
      const parsed = await parser.parse(processedCode, rootKey);
      processedCode = parsed.source;
      uniformsMap = parsed.uniforms || {};
    } catch (e) {
      preprocessError = e instanceof Error ? e.stack || e.message : String(e);
    }

    if (token !== this._updateToken) {return;}

    const payload: ShaderPayload = {
      type: "loadShader",
      title: fileName,
      shaderSource: processedCode,
      uniforms: uniformsMap,
      preprocessError,
    };

    this._lastPayload = payload;
    this._panel.title = `GLSLH Preview: ${fileName}`;

    if (this._webviewReady) {
      void this._panel.webview.postMessage(payload);
    }
  }

  public dispose() {
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
      this._updateTimer = undefined;
    }
    if (this._settleTimer) {
      clearTimeout(this._settleTimer);
      this._settleTimer = undefined;
    }
    this._updateToken++;
    this._lastDocument = undefined;
    this._lastPayload = undefined;
    this._webviewReady = false;
    ShaderPreviewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
