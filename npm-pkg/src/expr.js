const FUNCS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "atan2",
  "sqrt",
  "abs",
  "pow",
  "exp",
  "log",
  "min",
  "max",
  "floor",
  "ceil",
  "round",
  "sign",
  "hypot",
  // Shader & procedural utility additions
  "clamp",
  "mix",
  "smoothstep",
  "step",
  "mod",
  "length",
  "distance",
  "dot",
  "fract",
]);

// Custom implementations for useful GLSL math functions not natively on Math
const SHADER_MATH = {
  clamp: (x, min, max) => Math.min(Math.max(x, min), max),
  mix: (a, b, t) => a * (1 - t) + b * t,
  smoothstep: (edge0, edge1, x) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },
  step: (edge, x) => (x < edge ? 0 : 1),
  mod: (x, y) => x - y * Math.floor(x / y),
  length: (arr) => (Array.isArray(arr) ? Math.hypot(...arr) : Math.abs(arr)),
  distance: (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return Math.hypot(...a.map((v, i) => v - b[i]));
    }
    return Math.abs(a - b);
  },
  dot: (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.reduce((sum, v, i) => sum + v * b[i], 0);
    }
    return a * b;
  },
  fract: (x) => x - Math.floor(x),
};

const CONSTS = {
  PI: Math.PI,
  TAU: Math.PI * 2,
  E: Math.E,
  SQRT2: Math.SQRT2,
};

export function compileExpr(src) {
  src = src.trim();
  const toks = [];
  const re =
    /\s*(?:(\d*\.?\d+(?:[eE][+-]?\d+)?)|([A-Za-z_][\w.]*)|(\*\*|[-+*/%(),\[\]]))/y;

  for (let pos = 0; pos < src.length; ) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) throw new Error(`Bad expression "${src}" near ${pos}`);
    pos = re.lastIndex;
    toks.push(
      m[1] !== undefined
        ? { n: +m[1] }
        : m[2] !== undefined
          ? { id: m[2] }
          : { op: m[3] },
    );
  }

  let i = 0;
  const deps = new Set();
  const eat = (op) => (toks[i]?.op === op ? (i++, true) : false);
  const expect = (op) => {
    if (!eat(op)) throw new Error(`Expected '${op}' in "${src}"`);
  };

  const binary = (next, ops) => () => {
    let l = next();
    for (;;) {
      const op = ops.find(eat);
      if (!op) return l;
      const a = l,
        b = next();
      l =
        op === "+"
          ? (c) => a(c) + b(c)
          : op === "-"
            ? (c) => a(c) - b(c)
            : op === "*"
              ? (c) => a(c) * b(c)
              : op === "/"
                ? (c) => a(c) / b(c)
                : (c) => a(c) % b(c);
    }
  };

  const list = (end) => {
    const xs = [];
    if (!eat(end)) {
      do xs.push(expr());
      while (eat(","));
      expect(end);
    }
    return xs;
  };

  function primary() {
    const t = toks[i++];
    if (!t) throw new Error(`Unexpected end of "${src}"`);
    if (t.n !== undefined) return () => t.n;
    if (t.op === "(") {
      const e = expr();
      expect(")");
      return e;
    }
    if (t.op === "[") {
      const xs = list("]");
      return (c) => xs.map((f) => f(c));
    }

    if (t.id) {
      const isMath = t.id.startsWith("Math.");
      const name = isMath ? t.id.slice(5) : t.id;

      if (eat("(")) {
        if (!FUNCS.has(name)) throw new Error(`Function not allowed: ${t.id}`);
        const args = list(")");

        if (SHADER_MATH[name]) {
          return (c) => SHADER_MATH[name](...args.map((f) => f(c)));
        }
        return (c) => Math[name](...args.map((f) => f(c)));
      }

      if (isMath) {
        if (!(name in CONSTS)) throw new Error(`Unknown constant: ${t.id}`);
        return () => CONSTS[name];
      }

      deps.add(name);
      return (c) => {
        if (!Object.hasOwn(c, name))
          throw new Error(`Unknown variable "${name}" in "${src}"`);
        return c[name];
      };
    }
    throw new Error(`Unexpected '${t.op}' in "${src}"`);
  }

  function power() {
    const base = primary();
    if (eat("**")) {
      const exp = power();
      return (c) => base(c) ** exp(c);
    }
    return base;
  }

  function unary() {
    if (eat("-")) {
      const a = unary();
      return (c) => -a(c);
    }
    eat("+");
    return power();
  }

  const term = binary(unary, ["*", "/", "%"]);
  const expr = binary(term, ["+", "-"]);

  const run = expr();
  if (i !== toks.length) throw new Error(`Unexpected token in "${src}"`);
  return { run, deps: [...deps] };
}

export function parseExpression(src) {
  return compileExpr(src);
}
