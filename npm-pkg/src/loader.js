import * as THREE from "three";
import { GLSLHParser } from "./parser.js";

export class GLSLHLoader {
  constructor(parserInstance) {
    this.parser = parserInstance || new GLSLHParser();
  }

  async loadShaderModule(filePath) {
    const rawSource = await this.parser.fileResolver(filePath);
    // Pass filePath here so the parser knows the starting directory!
    const parsed = await this.parser.parse(rawSource, filePath);
    const threeUniforms = this.buildThreeUniforms(parsed.uniforms);

    return {
      source: parsed.source,
      uniforms: threeUniforms,

      createMaterial(vertexShaderSource, extraOptions = {}) {
        return new THREE.ShaderMaterial({
          vertexShader: vertexShaderSource,
          fragmentShader: parsed.source,
          uniforms: threeUniforms,
          ...extraOptions,
        });
      },
    };
  }

  buildThreeUniforms(rawDefs) {
    const threeUniforms = {};

    for (const [key, def] of Object.entries(rawDefs)) {
      let val = def.value;

      switch (def.type) {
        case "c":
          val = Array.isArray(val)
            ? new THREE.Color(...val)
            : new THREE.Color(val);
          break;
        case "v2":
          val = Array.isArray(val) ? new THREE.Vector2(...val) : val;
          break;
        case "v3":
          val = Array.isArray(val) ? new THREE.Vector3(...val) : val;
          break;
        case "v4":
          val = Array.isArray(val) ? new THREE.Vector4(...val) : val;
          break;
        default:
          val = val;
          break;
      }

      threeUniforms[key] = { value: val };
    }

    return threeUniforms;
  }
}
