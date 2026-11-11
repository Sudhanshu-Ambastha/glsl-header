import { compileExpr } from "./expr.js";

export function buildDerived(defs) {
  const items = [];
  const graph = new Map();
  const inDegree = new Map();
  const defsMap = new Map();

  for (const [name, d] of Object.entries(defs)) {
    if (d && typeof d.expr === "string") {
      const compiled = compileExpr(d.expr);
      defsMap.set(name, { name, ...compiled });
      graph.set(name, new Set());
      inDegree.set(name, 0);
    }
  }

  for (const [name, item] of defsMap) {
    for (const dep of item.deps) {
      if (defsMap.has(dep)) {
        if (!graph.has(dep)) graph.set(dep, new Set());
        if (!graph.get(dep).has(name)) {
          graph.get(dep).add(name);
          inDegree.set(name, (inDegree.get(name) || 0) + 1);
        }
      }
    }
  }

  const queue = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }

  const sortedNames = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    sortedNames.push(curr);

    const neighbors = graph.get(curr) || new Set();
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sortedNames.length !== defsMap.size) {
    throw new Error(
      "GLSLH Dependency Error: Circular dependency detected in derived @uniforms expressions!",
    );
  }

  for (const name of sortedNames) {
    items.push(defsMap.get(name));
  }

  return function update(
    uniforms,
    { time, delta, width, height, mouseX = 0, mouseY = 0 },
  ) {
    const ctx = {
      time,
      delta,
      width,
      height,
      aspect: width / height,
      mouseX,
      mouseY,
    };

    for (const [n, u] of Object.entries(uniforms)) {
      if (u && u.value !== undefined) {
        if (typeof u.value === "number") {
          ctx[n] = u.value;
        } else if (
          Array.isArray(u.value) ||
          u.value.isVector2 ||
          u.value.isVector3 ||
          u.value.isVector4
        ) {
          ctx[n] = u.value;
        }
      }
    }

    for (const it of items) {
      const v = it.run(ctx);
      const u = uniforms[it.name];

      if (!u || u.value === undefined) continue;

      if (u.value.isColor && Array.isArray(v)) {
        u.value.setRGB(v[0], v[1], v[2]);
      } else if (Array.isArray(v) && typeof u.value.set === "function") {
        u.value.set(...v);
      } else if (typeof v === "number" && typeof u.value === "number") {
        u.value = v;
      } else if (typeof u.value.set === "function" && typeof v === "number") {
        u.value.set(v);
      } else {
        u.value = v;
      }

      ctx[it.name] = v;
    }
  };
}
