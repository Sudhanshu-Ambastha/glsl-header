export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getPreviewHtml(title: string, cspSource: string): string {
  const safeTitle = escapeHtml(title);

  return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data: blob:; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource} 'unsafe-inline' https://unpkg.com; connect-src ${cspSource} https://unpkg.com;">
            <title>${safeTitle}</title>
            <style>
                body, html {
                    margin: 0; padding: 0; width: 100%; height: 100%;
                    overflow: hidden; background-color: #0b0b0e; color: #fff;
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .badge {
                    position: absolute; top: 14px; left: 14px;
                    background: rgba(15, 15, 20, 0.72); padding: 6px 12px;
                    border-radius: 6px; font-size: 12px; border: 1px solid rgba(255,255,255,0.12);
                    backdrop-filter: blur(4px); pointer-events: none; z-index: 5;
                }
                #error-box {
                    position: absolute; bottom: 14px; left: 14px; right: 14px;
                    background: rgba(185, 28, 28, 0.92); padding: 10px 14px; border-radius: 6px;
                    border: 1px solid rgba(254, 202, 202, 0.35);
                    font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
                    display: none; max-height: 200px; overflow-y: auto;
                    z-index: 10; white-space: pre-wrap; line-height: 1.45;
                }
                #retry-btn {
                    margin-top: 8px; padding: 4px 10px; border-radius: 4px;
                    border: 1px solid rgba(255,255,255,0.35); background: rgba(0,0,0,0.25);
                    color: #fff; font-size: 11px; cursor: pointer;
                }
                #canvas-container, canvas {
                    width: 100vw !important; height: 100vh !important; display: block;
                }
            </style>
            <script type="importmap">
                {
                    "imports": {
                        "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
                    }
                }
            </script>
        </head>
        <body>
            <div class="badge" id="badge">⚡ glslh live runner: ${safeTitle}</div>
            <div id="error-box">
                <div id="error-text"></div>
                <button id="retry-btn" type="button">Reload Shader</button>
            </div>
            <div id="canvas-container"></div>

            <script>
                const vscodeApi = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;
                const errorBox = document.getElementById('error-box');
                const errorText = document.getElementById('error-text');
                const retryBtn = document.getElementById('retry-btn');
                const badgeEl = document.getElementById('badge');
                let rafId = null;
                let panelVisible = true;
                let renderTick = null;

                function startLoop() {
                    if (!panelVisible || !renderTick) return;
                    if (rafId !== null) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                    const step = () => {
                        if (!panelVisible || !renderTick) {
                            rafId = null;
                            return;
                        }
                        rafId = requestAnimationFrame(step);
                        renderTick();
                    };
                    rafId = requestAnimationFrame(step);
                }

                function stopLoop() {
                    if (rafId !== null) {
                        cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                }

                function clearErrorBanner() {
                    errorBox.style.display = 'none';
                    errorText.textContent = '';
                }

                function showErrorBanner(label, detail) {
                    const msg = label + (detail ? "\\n" + detail : "");
                    errorBox.style.display = 'block';
                    errorText.textContent = msg;
                }

                retryBtn.addEventListener('click', () => {
                    clearErrorBanner();
                    if (vscodeApi) {
                        vscodeApi.postMessage({ type: "requestReload" });
                    }
                });

                window.addEventListener('error', (event) => {
                    showErrorBanner(
                        "Runtime Error (Line " + (event.lineno || "?") + ")",
                        event.message || String(event.error || "")
                    );
                });

                window.addEventListener('unhandledrejection', (event) => {
                    const reason = event.reason instanceof Error
                        ? (event.reason.stack || event.reason.message)
                        : String(event.reason);
                    showErrorBanner("Unhandled Promise Rejection", reason);
                });
            </script>

            <script type="module">
                import * as THREE from 'three';

                const KNOWN_VEC2_UNIFORMS = new Set(["u_resolution", "u_mouse"]);
                const KNOWN_VEC3_UNIFORMS = new Set(["u_sky_top", "u_sky_bottom", "u_line_color", "u_star_color"]);

                function num(v, fallback = 0) {
                    const n = Number(v);
                    return Number.isFinite(n) ? n : fallback;
                }

                function toVec2(val, fx = 0, fy = 0) {
                    if (val && val.isVector2) return val;
                    if (Array.isArray(val) && val.length >= 2) return new THREE.Vector2(num(val[0], fx), num(val[1], fy));
                    if (val && typeof val === "object" && "x" in val && "y" in val) return new THREE.Vector2(num(val.x, fx), num(val.y, fy));
                    return new THREE.Vector2(fx, fy);
                }

                function toVec3(val) {
                    if (val && val.isVector3) return val;
                    if (val && val.isColor) return new THREE.Vector3(val.r, val.g, val.b);
                    if (Array.isArray(val) && val.length >= 3) return new THREE.Vector3(num(val[0]), num(val[1]), num(val[2]));
                    if (val && typeof val === "object") {
                        if ("r" in val && "g" in val && "b" in val) return new THREE.Vector3(num(val.r), num(val.g), num(val.b));
                        if ("x" in val && "y" in val && "z" in val) return new THREE.Vector3(num(val.x), num(val.y), num(val.z));
                    }
                    return new THREE.Vector3(0, 0, 0);
                }

                function toVec4(val) {
                    if (val && val.isVector4) return val;
                    if (Array.isArray(val) && val.length >= 4) return new THREE.Vector4(num(val[0]), num(val[1]), num(val[2]), num(val[3], 1));
                    return new THREE.Vector4(0, 0, 0, 1);
                }

                function buildSafeUniforms(rawMap, width, height) {
                    const w = Math.max(width || 1, 1);
                    const h = Math.max(height || 1, 1);
                    const safe = {
                        u_time: { value: 0.0 },
                        u_delta: { value: 0.0 },
                        u_intensity: { value: 1.0 },
                        u_resolution: { value: new THREE.Vector2(w, h) },
                        u_mouse: { value: new THREE.Vector2(0, 0) }
                    };

                    if (!rawMap || typeof rawMap !== "object") return safe;

                    for (const [key, entry] of Object.entries(rawMap)) {
                        if (entry === undefined) continue;
                        const isObj = entry && typeof entry === "object";
                        const hasVal = isObj && Object.prototype.hasOwnProperty.call(entry, "value");
                        const val = hasVal ? entry.value : entry;
                        const type = isObj ? entry.type : undefined;

                        if (type === "v2" || type === "vec2" || KNOWN_VEC2_UNIFORMS.has(key) || (Array.isArray(val) && val.length === 2)) {
                            const fx = key === "u_resolution" ? w : 0;
                            const fy = key === "u_resolution" ? h : 0;
                            safe[key] = { value: toVec2(val, fx, fy) };
                        } else if (type === "c" || type === "v3" || type === "vec3" || KNOWN_VEC3_UNIFORMS.has(key) || (Array.isArray(val) && val.length === 3)) {
                            safe[key] = { value: toVec3(val) };
                        } else if (type === "v4" || type === "vec4" || (Array.isArray(val) && val.length === 4)) {
                            safe[key] = { value: toVec4(val) };
                        } else if (typeof val === "boolean") {
                            safe[key] = { value: val };
                        } else {
                            safe[key] = { value: num(val, 0.0) };
                        }
                    }

                    if (!(safe.u_resolution.value && safe.u_resolution.value.isVector2)) {
                        safe.u_resolution = { value: new THREE.Vector2(w, h) };
                    }
                    if (!(safe.u_mouse.value && safe.u_mouse.value.isVector2)) {
                        safe.u_mouse = { value: new THREE.Vector2(0, 0) };
                    }

                    return safe;
                }

                const container = document.getElementById('canvas-container');
                const renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: true
                });
                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
                renderer.setSize(Math.max(window.innerWidth, 1), Math.max(window.innerHeight, 1), false);
                container.appendChild(renderer.domElement);

                let lastPayload = null;

                renderer.domElement.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    stopLoop();
                    showErrorBanner("WebGL Context Lost", "GPU context reset. Will restore automatically or click Reload Shader.");
                });

                renderer.domElement.addEventListener('webglcontextrestored', () => {
                    clearErrorBanner();
                    if (lastPayload) {
                        applyShaderPayload(lastPayload);
                    }
                });

                const scene = new THREE.Scene();
                const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: 0x0b0b0e }));
                scene.add(quad);

                const vertexShader = \`
                    void main() {
                        gl_Position = vec4(position, 1.0);
                    }
                \`;

                let activeUniforms = {
                    u_time: { value: 0.0 },
                    u_delta: { value: 0.0 },
                    u_intensity: { value: 1.0 },
                    u_resolution: { value: new THREE.Vector2(Math.max(window.innerWidth, 1), Math.max(window.innerHeight, 1)) },
                    u_mouse: { value: new THREE.Vector2(0, 0) }
                };
                let activeMaterial = null;
                let checkedProgram = false;

                const clock = new THREE.Clock();

                function syncViewport() {
                    const w = Math.max(window.innerWidth || container.clientWidth || 1, 1);
                    const h = Math.max(window.innerHeight || container.clientHeight || 1, 1);
                    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
                    renderer.setSize(w, h, false);
                    if (activeUniforms.u_resolution && activeUniforms.u_resolution.value && activeUniforms.u_resolution.value.isVector2) {
                        activeUniforms.u_resolution.value.set(w, h);
                    }
                }

                function inspectProgram(mat) {
                    const state = renderer.properties.get(mat);
                    const program = state && state.program;
                    if (!program) return null;

                    const gl = renderer.getContext();
                    const programOk = gl.getProgramParameter(program.program, gl.LINK_STATUS);
                    const fragOk = gl.getShaderParameter(program.fragmentShader, gl.COMPILE_STATUS);
                    const vertOk = gl.getShaderParameter(program.vertexShader, gl.COMPILE_STATUS);

                    if (!programOk || !fragOk || !vertOk) {
                        const fragLog = gl.getShaderInfoLog(program.fragmentShader) || "";
                        const vertLog = gl.getShaderInfoLog(program.vertexShader) || "";
                        const progLog = gl.getProgramInfoLog(program.program) || "";
                        return [
                            fragLog ? "[Fragment Shader]\\n" + fragLog.trim() : "",
                            vertLog ? "[Vertex Shader]\\n" + vertLog.trim() : "",
                            progLog ? "[Program Link]\\n" + progLog.trim() : ""
                        ].filter(Boolean).join("\\n\\n") || "Unknown GLSL compile error.";
                    }
                    return "";
                }

                function drawFrame() {
                    const delta = clock.getDelta();
                    activeUniforms.u_time.value = clock.getElapsedTime();
                    activeUniforms.u_delta.value = delta;
                    renderer.render(scene, camera);

                    if (!checkedProgram && activeMaterial) {
                        const errDetail = inspectProgram(activeMaterial);
                        if (errDetail !== null) {
                            checkedProgram = true;
                            if (errDetail) {
                                showErrorBanner("WebGL Shader Compilation Error", errDetail);
                            } else {
                                clearErrorBanner();
                            }
                        }
                    }
                }

                renderTick = () => {
                    try {
                        drawFrame();
                    } catch (err) {
                        showErrorBanner("Render Runtime Error", err.stack || err.message);
                    }
                };

                function applyShaderPayload(msg) {
                    lastPayload = msg;
                    if (msg.title) {
                        badgeEl.textContent = "⚡ glslh live runner: " + msg.title;
                    }

                    syncViewport();
                    const w = Math.max(window.innerWidth || 1, 1);
                    const h = Math.max(window.innerHeight || 1, 1);

                    if (msg.preprocessError) {
                        showErrorBanner("Preprocessing Error", msg.preprocessError);
                        return;
                    }

                    const nextUniforms = buildSafeUniforms(msg.uniforms || {}, w, h);

                    try {
                        const nextMat = new THREE.ShaderMaterial({
                            vertexShader,
                            fragmentShader: msg.shaderSource || "",
                            uniforms: nextUniforms,
                            glslVersion: THREE.GLSL3
                        });

                        renderer.compile(scene, camera);
                        const errDetail = inspectProgram(nextMat);
                        if (errDetail) {
                            nextMat.dispose();
                            showErrorBanner("WebGL Shader Compilation Error", errDetail);
                            startLoop();
                            return;
                        }

                        const prevMat = activeMaterial;
                        activeUniforms = nextUniforms;
                        activeMaterial = nextMat;
                        quad.material = activeMaterial;
                        checkedProgram = true;
                        clearErrorBanner();

                        if (prevMat && prevMat !== nextMat) {
                            prevMat.dispose();
                        }

                        drawFrame();
                        startLoop();
                    } catch (err) {
                        showErrorBanner("Shader Material Error", err.stack || err.message);
                        startLoop();
                    }
                }

                window.addEventListener('message', (event) => {
                    const msg = event.data;
                    if (!msg || typeof msg !== "object") return;
                    if (msg.type === "loadShader") {
                        applyShaderPayload(msg);
                    } else if (msg.type === "settleRepaint") {
                        syncViewport();
                        drawFrame();
                        startLoop();
                    } else if (msg.type === "setVisible") {
                        panelVisible = Boolean(msg.visible);
                        if (panelVisible) {
                            syncViewport();
                            drawFrame();
                            startLoop();
                        } else {
                            stopLoop();
                        }
                    } else if (msg.type === "resume") {
                        panelVisible = true;
                        syncViewport();
                        drawFrame();
                        startLoop();
                    }
                });

                document.addEventListener('visibilitychange', () => {
                    panelVisible = !document.hidden;
                    if (panelVisible) {
                        syncViewport();
                        drawFrame();
                        startLoop();
                    } else {
                        stopLoop();
                    }
                });

                window.addEventListener('pointermove', (e) => {
                    if (!activeUniforms.u_mouse || !activeUniforms.u_mouse.value.isVector2) return;
                    activeUniforms.u_mouse.value.set(e.clientX, window.innerHeight - e.clientY);
                });

                let resizeTimer = null;
                window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer);
                    resizeTimer = setTimeout(() => {
                        syncViewport();
                        drawFrame();
                    }, 50);
                });

                startLoop();
                if (vscodeApi) {
                    vscodeApi.postMessage({ type: "ready" });
                }
            </script>
        </body>
        </html>`;
}
