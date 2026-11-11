"use strict";
import * as THREE from "three";
import { GLSLHParser, BUILTINS } from "./parser.js";
import { buildDerived } from "./derived.js";

const ZERO_DEFAULTS = {
  f: 0,
  i: 0,
  b: false,
  c: [1, 1, 1],
  v2: [0, 0],
  v3: [0, 0, 0],
  v4: [0, 0, 0, 0],
};

export class GLSLHLoader {
  constructor(parserInstance) {
    this.parser = parserInstance || new GLSLHParser();
  }

  async loadShaderModule(filePath) {
    const rawSource = await this.parser.fileResolver(filePath);
    const parsed = await this.parser.parse(rawSource, filePath);

    for (const [builtinName, builtinInfo] of Object.entries(BUILTINS)) {
      if (!parsed.uniforms[builtinName]) {
        parsed.uniforms[builtinName] = {
          type: builtinInfo.type,
          builtin: true,
        };
      }
    }

    const threeUniforms = this.buildThreeUniforms(parsed.uniforms);
    const updateDerived = buildDerived(parsed.uniforms);

    return {
      source: parsed.source,
      uniforms: threeUniforms,
      update: updateDerived,

      createMaterial(vertexShaderSource, extraOptions = {}) {
        return new THREE.ShaderMaterial({
          vertexShader: vertexShaderSource,
          fragmentShader: parsed.source,
          uniforms: threeUniforms,
          glslVersion: THREE.GLSL3,
          ...extraOptions,
        });
      },
    };
  }

  buildThreeUniforms(rawDefs) {
    const threeUniforms = {};

    for (const [key, def] of Object.entries(rawDefs)) {
      const type =
        def.type || (key === "u_resolution" || key === "u_mouse" ? "v2" : "f");
      let val =
        def.value !== undefined ? def.value : (ZERO_DEFAULTS[type] ?? 0);

      switch (type) {
        case "c":
          val = Array.isArray(val)
            ? new THREE.Color(...val)
            : new THREE.Color(val);
          break;
        case "v2":
          val = Array.isArray(val)
            ? new THREE.Vector2(...val)
            : new THREE.Vector2(val, val);
          break;
        case "v3":
          val = Array.isArray(val)
            ? new THREE.Vector3(...val)
            : new THREE.Vector3(val, val, val);
          break;
        case "v4":
          val = Array.isArray(val)
            ? new THREE.Vector4(...val)
            : new THREE.Vector4(val, val, val, val);
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
