/* Ulaara aurora: the Red Blue Purple splash shader, translated into
   ivory, parchment, champagne, stone and mineral blush. */
(() => {
  const canvas = document.getElementById("ulaara-aurora");
  const gl = canvas && canvas.getContext("webgl", { antialias: false });
  if (!gl) {
    if (canvas) canvas.style.display = "none";
    return;
  }

  const vertex = `
    attribute vec2 a;
    void main() {
      gl_Position = vec4(a, 0.0, 1.0);
    }
  `;

  const fragment = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uMouse;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = p * 2.02 + vec2(1.7, 9.2);
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes.xy;
      vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 2.2;
      float t = uTime * 0.045;

      vec2 q = vec2(
        fbm(p + vec2(0.0, t)),
        fbm(p + vec2(5.2, 1.3) - t * 0.8)
      );
      vec2 r = vec2(
        fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.12 * t),
        fbm(p + 3.0 * q + vec2(8.3, 2.8) - 0.10 * t)
      );
      float f = fbm(p + 3.5 * r);

      vec3 parchment = vec3(0.902, 0.878, 0.824);
      vec3 ivory = vec3(0.988, 0.976, 0.941);
      vec3 champagne = vec3(0.792, 0.702, 0.565);
      vec3 stone = vec3(0.575, 0.548, 0.505);
      vec3 blush = vec3(0.772, 0.668, 0.646);

      float field = smoothstep(0.30, 0.76, f);
      vec3 color = parchment;
      color = mix(color, ivory, field * 0.78);
      color = mix(color, champagne, smoothstep(0.46, 0.98, length(q)) * 0.20);
      color = mix(color, stone, smoothstep(0.58, 1.08, r.x + r.y) * 0.12);

      float blushField =
        smoothstep(0.86, 0.0, distance(uv, vec2(0.84, 0.20))) *
        smoothstep(0.34, 0.74, f);
      color = mix(color, blush, blushField * 0.12);
      color += ivory * pow(field, 3.0) * 0.055;

      float pointerDistance = distance(uv, uMouse);
      color += ivory * smoothstep(0.34, 0.0, pointerDistance) * 0.09;
      color += champagne * smoothstep(0.15, 0.0, pointerDistance) * 0.055;

      color *= 1.0 - 0.11 * pow(distance(uv, vec2(0.5, 0.46)), 1.7);
      float grain = hash(gl_FragCoord.xy + fract(uTime) * vec2(91.7, 73.3));
      color += (grain - 0.5) * 0.012;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  const position = gl.getAttribLocation(program, "a");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const resolution = gl.getUniformLocation(program, "uRes");
  const time = gl.getUniformLocation(program, "uTime");
  const mouse = gl.getUniformLocation(program, "uMouse");
  const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let pointer = [0.5, 0.54];
  let pointerTarget = [0.5, 0.54];

  function resize() {
    const density = Math.min(devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(innerWidth * density);
    canvas.height = Math.round(innerHeight * density);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  addEventListener("resize", resize, { passive: true });
  addEventListener(
    "pointermove",
    (event) => {
      pointerTarget = [event.clientX / innerWidth, 1 - event.clientY / innerHeight];
    },
    { passive: true }
  );

  resize();
  const start = performance.now();

  function draw(now) {
    pointer[0] += (pointerTarget[0] - pointer[0]) * 0.05;
    pointer[1] += (pointerTarget[1] - pointer[1]) * 0.05;
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(time, prefersReducedMotion ? 0.0 : (now - start) / 1000);
    gl.uniform2f(mouse, pointer[0], pointer[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();
