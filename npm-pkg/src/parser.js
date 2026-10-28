export class GLSLHParser {
  constructor(fileResolver) {
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

  resolvePath(parentPath, relativePath) {
    if (!parentPath) return relativePath;

    const lastSlash = parentPath.lastIndexOf("/");
    if (lastSlash === -1) return relativePath;
    const parentDir = parentPath.substring(0, lastSlash);

    const cleanRelative = relativePath.startsWith("./")
      ? relativePath.substring(2)
      : relativePath;

    return `${parentDir}/${cleanRelative}`;
  }

  async parse(sourceCode, currentFilePath = "") {
    return await this._parseRecursive(sourceCode, currentFilePath, new Set());
  }

  async _parseRecursive(sourceCode, currentFilePath, includedFiles) {
    let processed = sourceCode;
    const uniformRegex = /\/\*\s*@uniforms([\s\S]*?)\*\//;
    const match = processed.match(uniformRegex);
    let uniformsDefinition = {};

    if (match) {
      try {
        uniformsDefinition = JSON.parse(match[1].trim());
        processed = processed.replace(uniformRegex, "");
      } catch (e) {
        console.error(
          "GLSLH Parser Error: Invalid JSON format inside @uniforms block.",
          e,
        );
      }
    }

    const includeRegex = /^#include\s+["<](.+)[">]/gm;
    let includeMatch;
    let includes = [];

    while ((includeMatch = includeRegex.exec(processed)) !== null) {
      includes.push({ fullMatch: includeMatch[0], path: includeMatch[1] });
    }

    for (const inc of includes) {
      const resolvedPath = this.resolvePath(currentFilePath, inc.path);

      this.validateExtension(resolvedPath);

      if (includedFiles.has(resolvedPath)) {
        processed = processed.replace(
          inc.fullMatch,
          `// Circular include prevented: ${resolvedPath}`,
        );
        continue;
      }
      includedFiles.add(resolvedPath);

      let subSource = this.includeCache.get(resolvedPath);
      if (!subSource) {
        let rawSubText = await this.fileResolver(resolvedPath);
        const parsedSub = await this._parseRecursive(
          rawSubText,
          resolvedPath,
          includedFiles,
        );
        subSource = parsedSub.source;
        this.includeCache.set(resolvedPath, subSource);
      }

      processed = processed.replace(
        inc.fullMatch,
        `\n// --- BEGIN INCLUDE: ${resolvedPath} ---\n${subSource}\n// --- END INCLUDE: ${resolvedPath} ---\n`,
      );
    }

    processed = processed.replace(
      /Math\.([A-Z0-9_]+)/g,
      (match, constantName) => {
        if (constantName === "TAU") return (Math.PI * 2).toString();
        if (typeof Math[constantName] === "number")
          return Math[constantName].toString();
        console.warn(
          `GLSLH Warning: Unknown Math constant 'Math.${constantName}'`,
        );
        return match;
      },
    );

    return {
      source: processed,
      uniforms: uniformsDefinition,
    };
  }
}
