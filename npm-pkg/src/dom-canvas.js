import * as THREE from "three";
import { GLSLHLoader } from "./loader.js";

export class GLSLHDomCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.loader = new GLSLHLoader();
    this.width = Number.parseInt(this.canvas.getAttribute("width"), 10) || 600;
    this.height =
      Number.parseInt(this.canvas.getAttribute("height"), 10) || 400;

    this.ready = false;
    this.error = null;
    this.animationId = null;
    this.mouseX = 0.0;
    this.mouseY = 0.0;

    this.init();
    this.bindEvents();
  }

  bindEvents() {
    this.onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      // Invert Y to match standard GLSL coordinate conventions (bottom-left origin)
      this.mouseY = rect.height - (e.clientY - rect.top);
    };
    this.canvas.addEventListener("mousemove", this.onMouseMove);
  }

  async init() {
    const fragUrl = this.canvas.getAttribute("data-fragment-url");

    console.log("GLSLH: Initializing WebGL Renderer...");
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
      });
      this.renderer.setSize(this.width, this.height, false);

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const vertexShader = `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `;

      let fragmentShader = "";
      let uniforms = {};
      let shaderModule = null;

      console.log(`GLSLH: Fetching and parsing shader module -> ${fragUrl}`);
      shaderModule = await this.loader.loadShaderModule(fragUrl);
      console.log("GLSLH: Shader successfully parsed!", shaderModule);

      fragmentShader = shaderModule.source;
      uniforms = shaderModule.uniforms;

      this.shaderModule = shaderModule;
      this.uniforms = uniforms;

      if (this.uniforms.u_resolution && !this.uniforms.u_resolution.value) {
        this.uniforms.u_resolution.value = new THREE.Vector2(
          this.width,
          this.height,
        );
      }
      if (this.uniforms.u_time && this.uniforms.u_time.value === undefined) {
        this.uniforms.u_time.value = 0.0;
      }

      this.material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: this.uniforms,
        glslVersion: THREE.GLSL3,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      this.mesh = new THREE.Mesh(geometry, this.material);
      this.scene.add(this.mesh);

      this.clock = new THREE.Clock();
      this.ready = true;
      this.animate();
    } catch (err) {
      this.error = err;
      console.error("❌ GLSLH Pipeline Error:", err);
    }
  }

  animate() {
    if (!this.ready) return;
    this.animationId = requestAnimationFrame(() => this.animate());

    // Fix: Call getDelta() first to update the clock, then read elapsed time
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.elapsedTime;

    if (this.uniforms.u_time) {
      this.uniforms.u_time.value = elapsedTime;
    }
    if (this.uniforms.u_delta) {
      this.uniforms.u_delta.value = delta;
    }
    if (this.uniforms.u_mouse) {
      this.uniforms.u_mouse.value.set(this.mouseX, this.mouseY);
    }

    if (this.shaderModule && typeof this.shaderModule.update === "function") {
      try {
        this.shaderModule.update(this.uniforms, {
          time: elapsedTime,
          delta: delta,
          width: this.width,
          height: this.height,
          mouseX: this.mouseX,
          mouseY: this.mouseY,
        });
      } catch (evalErr) {
        console.error(
          "GLSLH Evaluation Error in derived update loop:",
          evalErr,
        );
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.onMouseMove) {
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
    }
    this.mesh?.geometry?.dispose();
    this.material?.dispose();
    this.renderer?.dispose();
    this.ready = false;
    console.log("GLSLH: Canvas instance disposed cleanly.");
  }
}

export function autoInitGlslCanvases(selector = "canvas.glsl-canvas") {
  const instances = [];
  document.querySelectorAll(selector).forEach((canvas) => {
    instances.push(new GLSLHDomCanvas(canvas));
  });
  return instances;
}
