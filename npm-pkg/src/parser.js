import { detectFunctionCollisions } from "./validator.js";

export const BUILTINS = {
  u_time: { type: "f", from: (f) => f.time },
  u_delta: { type: "f", from: (f) => f.delta },
  u_resolution: { type: "v2", from: (f) => [f.width, f.height] },
  u_aspect: { type: "f", from: (f) => f.width / f.height },
  u_mouse: { type: "v2", from: (f) => [f.mouseX, f.mouseY] },
};

const GLSL_TYPE = {
  f: "float",
  i: "int",
  b: "bool",
  c: "vec3",
  v2: "vec2",
  v3: "vec3",
  v4: "vec4",
};

export class GLSLHParser {
  constructor(fileResolver, standardLibraryResolver) {
    this.fileResolver =
      fileResolver ||
      (async (path) => {
        const res = await fetch(path);
        if (!res.ok)
          throw new Error(
            `Could not load shader file: ${path} (Status: ${res.status})`,
          );
        return await res.text();
      });

    this.standardLibraryResolver =
      standardLibraryResolver ||
      (async (libPath) => {
        const res = await fetch(`https://unpkg.com/glslh/lib/${libPath}`);
        if (!res.ok)
          throw new Error(
            `Could not load standard library module: <${libPath}>`,
          );
        return await res.text();
      });

    this.includeCache = new Map();

    this.allowedExtensions = [
      ".glsl",
      ".glslh",
      ".frag",
      ".vert",
      ".frag.glsl",
      ".vert.glsl",
    ];
  }

  validateExtension(filePath) {
    if (filePath.startsWith("http://") || filePath.startsWith("https://"))
      return;

    const lowerPath = filePath.toLowerCase();
    const isValid = this.allowedExtensions.some((ext) =>
      lowerPath.endsWith(ext),
    );
    if (!isValid) {
      throw new Error(
        `GLSLH Security Error: Unsupported file extension for include -> '${filePath}'. Allowed extensions: ${this.allowedExtensions.join(", ")}`,
      );
    }
  }

  resolvePath(parentPath, relativePath, isSystemInclude) {
    if (isSystemInclude) {
      return relativePath;
    }

    if (!parentPath) return relativePath;

    if (relativePath.startsWith("/")) {
      return relativePath.substring(1);
    }

    const lastSlash = parentPath.lastIndexOf("/");
    if (lastSlash === -1) return relativePath;
    const parentDir = parentPath.substring(0, lastSlash);
    const stack = parentDir ? parentDir.split("/") : [];
    const parts = relativePath.split("/");

    for (const part of parts) {
      if (part === "" || part === ".") continue;
      if (part === "..") {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }

    return stack.join("/");
  }

  async parse(sourceCode, currentFilePath = "") {
    const result = await this._parseRecursive(
      sourceCode,
      currentFilePath,
      new Set(),
    );

    detectFunctionCollisions(result.source);

    return result;
  }

  async _parseRecursive(sourceCode, currentFilePath, includedFiles) {
    let processed = sourceCode;
    const uniformRegex = /\/\*\s*@uniforms([\s\S]*?)\*\//g;
    let match;
    let uniformsDefinition = {};

    while ((match = uniformRegex.exec(sourceCode)) !== null) {
      try {
        const parsedBlock = JSON.parse(match[1].trim());
        uniformsDefinition = { ...uniformsDefinition, ...parsedBlock };
      } catch (e) {
        console.error(
          "GLSLH Parser Error: Invalid JSON format inside @uniforms block.",
          e,
        );
      }
    }
    processed = processed.replace(uniformRegex, "");

    const includeRegex = /^#include\s+(["<])(.+)([">])/gm;
    let includeMatch;
    let includes = [];

    while ((includeMatch = includeRegex.exec(processed)) !== null) {
      const openDelimiter = includeMatch[1];
      const incPath = includeMatch[2];
      const closeDelimiter = includeMatch[3];

      if (
        (openDelimiter === '"' && closeDelimiter !== '"') ||
        (openDelimiter === "<" && closeDelimiter !== ">")
      ) {
        throw new Error(
          `GLSLH Syntax Error: Mismatched include delimiters for '${incPath}'`,
        );
      }

      includes.push({
        fullMatch: includeMatch[0],
        path: incPath,
        isSystem: openDelimiter === "<",
      });
    }

    for (const inc of includes) {
      const resolvedPath = this.resolvePath(
        currentFilePath,
        inc.path,
        inc.isSystem,
      );

      this.validateExtension(resolvedPath);

      if (includedFiles.has(resolvedPath)) {
        processed = processed.replace(
          inc.fullMatch,
          `// Circular include prevented: ${resolvedPath}`,
        );
        continue;
      }
      includedFiles.add(resolvedPath);

      let subSource = this.includeCache.get(resolvedPath)?.source;
      let subUniforms = {};

      if (!subSource) {
        const rawSubText = inc.isSystem
          ? await this.standardLibraryResolver(resolvedPath)
          : await this.fileResolver(resolvedPath);

        const parsedSub = await this._parseRecursive(
          rawSubText,
          resolvedPath,
          includedFiles,
        );
        subSource = parsedSub.source;
        subUniforms = parsedSub.uniforms;
        this.includeCache.set(resolvedPath, {
          source: subSource,
          uniforms: subUniforms,
        });
      } else {
        subUniforms = this.includeCache.get(resolvedPath).uniforms;
      }

      uniformsDefinition = { ...subUniforms, ...uniformsDefinition };

      processed = processed.replace(
        inc.fullMatch,
        `\n// --- BEGIN INCLUDE: ${resolvedPath} ---\n${subSource}\n// --- END INCLUDE: ${resolvedPath} ---\n`,
      );
    }

    const usedConstants = new Set();

    processed = processed.replace(
      /Math\.([A-Z0-9_]+)/g,
      (match, constantName) => {
        if (constantName === "TAU" || typeof Math[constantName] === "number") {
          usedConstants.add(constantName);
          return `MATH_${constantName}`;
        }
        console.warn(
          `GLSLH Warning: Unknown Math constant 'Math.${constantName}'`,
        );
        return match;
      },
    );

    const cleanCodeForScanning = processed.replace(
      /\/\/.*|\/\*[\s\S]*?\*\//g,
      "",
    );
    const usedUniforms = [
      ...new Set(cleanCodeForScanning.match(/\bu_\w+\b/g) ?? []),
    ];

    for (const name of usedUniforms) {
      if (BUILTINS[name]) {
        uniformsDefinition[name] ??= {
          type: BUILTINS[name].type,
          builtin: true,
        };
      } else if (!uniformsDefinition[name]) {
        console.warn(
          `GLSLH Warning: Uniform '${name}' is used in shader source but not defined in @uniforms or built-ins.`,
        );
      }
    }

    const versionRegex = /\s*#version\s+[^\r\n]+(?:\r?\n)?/g;
    processed = processed.replace(versionRegex, "");
    processed = processed.trimStart();

    let constantsBlock = "";
    if (usedConstants.size > 0) {
      constantsBlock = "// --- GLSLH Auto-injected Math Constants ---\n";
      for (const constantName of usedConstants) {
        const val = constantName === "TAU" ? Math.PI * 2 : Math[constantName];
        constantsBlock += `#define MATH_${constantName} ${val}\n`;
      }
      constantsBlock += "\n";
    }

    let declBlock = "";
    const declLines = Object.entries(uniformsDefinition)
      .filter(
        ([n]) => !new RegExp(`\\buniform\\s+\\w+\\s+${n}\\b`).test(processed),
      )
      .map(([n, d]) => `uniform ${GLSL_TYPE[d.type] ?? "float"} ${n};`);

    if (declLines.length > 0) {
      declBlock =
        "\n// --- GLSLH Auto-injected Uniform Declarations ---\n" +
        declLines.join("\n") +
        "\n\n";
    }

    processed = constantsBlock + declBlock + processed;

    return {
      source: processed,
      uniforms: uniformsDefinition,
    };
  }
}
