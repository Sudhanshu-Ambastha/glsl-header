import * as THREE from "three";
import { GLSLHLoader } from "./loader.js";

export class GLSLHDomCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.loader = new GLSLHLoader();
    this.init();
  }

  async init() {
    const fragUrl = this.canvas.getAttribute("data-fragment-url");
    const width = parseInt(this.canvas.getAttribute("width")) || 600;
    const height = parseInt(this.canvas.getAttribute("height")) || 400;

    console.log("GLSLH: Initializing WebGL Renderer...");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(width, height, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const vertexShader = `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    let fragmentShader = "";
    let uniforms = {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
    };

    try {
      console.log(`GLSLH: Fetching and parsing shader module -> ${fragUrl}`);
      const shaderModule = await this.loader.loadShaderModule(fragUrl);
      console.log("GLSLH: Shader successfully parsed!", shaderModule);

      fragmentShader = shaderModule.source;
      uniforms = { ...shaderModule.uniforms, ...uniforms };
    } catch (err) {
      console.error("❌ GLSLH Pipeline Error:", err);
      // Fallback to bright red if loading fails
      fragmentShader = `
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `;
    }

    this.uniforms = uniforms;
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.clock = new THREE.Clock();
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.uniforms.u_time) {
      this.uniforms.u_time.value = this.clock.getElapsedTime();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

export function autoInitGlslCanvases(selector = "canvas.glsl-canvas") {
  document
    .querySelectorAll(selector)
    .forEach((canvas) => new GLSLHDomCanvas(canvas));
}
