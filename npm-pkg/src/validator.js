export function detectFunctionCollisions(flattenedSource) {
  const funcRegex =
    /\b(float|int|bool|vec2|vec3|vec4|mat2|mat3|mat4|void)\s+(\w+)\s*\(([^)]*)\)\s*(;|\{[^}]*\})/g;

  const funcRegistry = new Map();
  const lines = flattenedSource.split(/\r?\n/);
  let currentFile = "root";

  for (const line of lines) {
    const beginMatch = line.match(/\/\/\s*---\s*BEGIN INCLUDE:\s*(.+)\s*---/);
    if (beginMatch) {
      currentFile = beginMatch[1].trim();
      continue;
    }

    let match;
    funcRegex.lastIndex = 0;
    while ((match = funcRegex.exec(line)) !== null) {
      const returnType = match[1];
      const funcName = match[2];
      const params = match[3].trim().replace(/\s+/g, " ");
      const bodyOrSemi = match[4].trim();

      if (funcName === "main") continue;
      if (bodyOrSemi.startsWith(";")) continue;

      if (!funcRegistry.has(funcName)) {
        funcRegistry.set(funcName, new Map());
      }

      const overloads = funcRegistry.get(funcName);
      const signatureKey = `(${params})`;

      if (overloads.has(signatureKey)) {
        const firstFile = overloads.get(signatureKey);
        if (firstFile !== currentFile) {
          console.warn(
            `⚠️ GLSLH Duplicate Definition Warning: Exact signature '${funcName}${signatureKey}' is defined in both '${firstFile}' and '${currentFile}'. This will cause a compilation clash in WebGL.`,
          );
        }
      } else {
        overloads.set(signatureKey, currentFile);
      }
    }
  }
}

export function translateShaderError(
  errorMessage,
  flattenedSource,
  rootFilePath = "shader.glslh",
) {
  const lines = flattenedSource.split(/\r?\n/);
  const lineMap = [];
  const fileStack = [rootFilePath];
  const lineCounters = { [rootFilePath]: 0 };

  for (const line of lines) {
    const beginMatch = line.match(/\/\/\s*---\s*BEGIN INCLUDE:\s*(.+)\s*---/);
    const endMatch = line.match(/\/\/\s*---\s*END INCLUDE:\s*(.+)\s*---/);

    if (beginMatch) {
      const incPath = beginMatch[1].trim();
      fileStack.push(incPath);
      lineCounters[incPath] = 0;
      lineMap.push({ file: incPath, line: -1, isMarker: true });
      continue;
    } else if (endMatch) {
      fileStack.pop();
      lineMap.push({
        file: fileStack.at(-1),
        line: -1,
        isMarker: true,
      });
      continue;
    }

    const currentFile = fileStack.at(-1);
    lineCounters[currentFile] = (lineCounters[currentFile] || 0) + 1;
    lineMap.push({ file: currentFile, line: lineCounters[currentFile] });
  }

  const errorRegex = /(?:ERROR:\s*0:|Line\s+|:\s*0:)(\d+)/gi;

  return errorMessage.replace(errorRegex, (match, lineNumStr) => {
    const flatLine = Number.parseInt(lineNumStr, 10);
    const mapped = lineMap.at(flatLine - 1);

    if (mapped && !mapped.isMarker) {
      const contextStart = Math.max(0, flatLine - 3);
      const contextEnd = Math.min(lines.length - 1, flatLine + 1);
      let snippet = "\n--- Code Context ---\n";

      for (let i = contextStart; i <= contextEnd; i++) {
        const prefix = i === flatLine - 1 ? " >> " : "    ";
        snippet += `${prefix}${i + 1}: ${lines[i]}\n`;
      }
      snippet += "--------------------";

      return `[File: ${mapped.file} | Line: ${mapped.line}]${snippet}`;
    }
    return match;
  });
}
