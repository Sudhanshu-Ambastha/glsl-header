import * as vscode from "vscode";
import { ShaderPreviewPanel } from "./previewPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("glslh-previewer is active and ready.");

  const disposable = vscode.commands.registerCommand(
    "glslh-previewer.openPreview",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage(
          "Open a .glslh or .glsl file to preview.",
        );
        return;
      }
      ShaderPreviewPanel.createOrShow(context.extensionUri, editor.document);
    },
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (
        ShaderPreviewPanel.currentPanel &&
        document.uri.toString() ===
          vscode.window.activeTextEditor?.document.uri.toString()
      ) {
        ShaderPreviewPanel.currentPanel.update(document);
      }
    }),
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
