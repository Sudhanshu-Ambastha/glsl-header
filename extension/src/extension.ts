import * as vscode from "vscode";
import { ShaderPreviewPanel } from "./previewPanel";

function isShaderDocument(document: vscode.TextDocument): boolean {
  if (document.languageId === "glslh" || document.languageId === "glsl") {
    return true;
  }
  return /\.(glsl|glslh|frag|vert|frag\.glsl|vert\.glsl)$/i.test(
    document.fileName,
  );
}

export function activate(context: vscode.ExtensionContext) {
  console.log("glslh-previewer is active and ready.");

  const previewCommand = vscode.commands.registerCommand(
    "glslh-previewer.openPreview",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage(
          "Open a .glslh or shader file to preview.",
        );
        return;
      }
      ShaderPreviewPanel.createOrShow(context.extensionUri, editor.document);
    },
  );

  const shaderDocumentSelector: vscode.DocumentSelector = [
    { language: "glslh" },
    { language: "glsl" },
    { pattern: "**/*.{glsl,glslh,frag,vert,frag.glsl,vert.glsl}" },
  ];

  const colorProvider = vscode.languages.registerColorProvider(
    shaderDocumentSelector,
    {
      provideDocumentColors(
        document: vscode.TextDocument,
      ): vscode.ColorInformation[] {
        const colors: vscode.ColorInformation[] = [];
        const text = document.getText();

        const jsonArrayRegex =
          /\[\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\]/g;
        const vecConstructorRegex =
          /\bvec[34]\s*\(\s*([0-9]*\.?[0-9]+)\s*,\s*([0-9]*\.?[0-9]+)\s*,\s*([0-9]*\.?[0-9]+)(?:\s*,\s*([0-9]*\.?[0-9]+))?\s*\)/g;

        const regexes = [jsonArrayRegex, vecConstructorRegex];

        for (const regex of regexes) {
          let match;
          while ((match = regex.exec(text)) !== null) {
            const r = parseFloat(match[1]);
            const g = parseFloat(match[2]);
            const b = parseFloat(match[3]);
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1.0;

            if (
              r <= 1.0 &&
              g <= 1.0 &&
              b <= 1.0 &&
              r >= 0 &&
              g >= 0 &&
              b >= 0
            ) {
              const startPos = document.positionAt(match.index);
              const endPos = document.positionAt(match.index + match[0].length);
              const range = new vscode.Range(startPos, endPos);

              colors.push(
                new vscode.ColorInformation(
                  range,
                  new vscode.Color(r, g, b, a),
                ),
              );
            }
          }
        }

        return colors;
      },

      provideColorPresentations(
        color: vscode.Color,
        ctx: { document: vscode.TextDocument; range: vscode.Range },
      ): vscode.ColorPresentation[] {
        const fmt = (n: number) => {
          const s = Number(n.toFixed(3)).toString();
          return s.includes(".") ? s : s + ".0";
        };

        const r = fmt(color.red);
        const g = fmt(color.green);
        const b = fmt(color.blue);
        const a = fmt(color.alpha);

        const originalText = ctx.document.getText(ctx.range);
        let presentationText = `[${r}, ${g}, ${b}]`;

        if (originalText.startsWith("vec3")) {
          presentationText = `vec3(${r}, ${g}, ${b})`;
        } else if (originalText.startsWith("vec4")) {
          presentationText = `vec4(${r}, ${g}, ${b}, ${a})`;
        } else if (originalText.includes("[")) {
          presentationText =
            originalText.includes(",") && originalText.split(",").length > 3
              ? `[${r}, ${g}, ${b}, ${a}]`
              : `[${r}, ${g}, ${b}]`;
        }

        return [new vscode.ColorPresentation(presentationText)];
      },
    },
  );

  const editorSwitchListener = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (
        ShaderPreviewPanel.currentPanel &&
        editor &&
        isShaderDocument(editor.document)
      ) {
        ShaderPreviewPanel.currentPanel.scheduleUpdate(editor.document, 1);
      }
    },
  );

  const changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.contentChanges.length === 0) {return;}
    const doc = event.document;
    if (
      ShaderPreviewPanel.currentPanel &&
      isShaderDocument(doc) &&
      doc.uri.toString() ===
        vscode.window.activeTextEditor?.document.uri.toString()
    ) {
      ShaderPreviewPanel.currentPanel.scheduleUpdate(doc, 1);
    }
  });

  const saveListener = vscode.workspace.onDidSaveTextDocument((document) => {
    if (
      ShaderPreviewPanel.currentPanel &&
      isShaderDocument(document) &&
      document.uri.toString() ===
        vscode.window.activeTextEditor?.document.uri.toString()
    ) {
      ShaderPreviewPanel.currentPanel.scheduleUpdate(document, 0);
    }
  });

  context.subscriptions.push(
    previewCommand,
    colorProvider,
    editorSwitchListener,
    changeListener,
    saveListener,
  );
}

export function deactivate() {}
