(() => {
  const floor = document.querySelector(".gradient-floor");
  const canvas = floor.querySelector("canvas");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return; // The CSS gradient also works without JavaScript or WebGL.

  const vertexSource = `
    attribute vec2 position;
    varying vec2 uv;
    void main() {
      uv = position * 0.5 + 0.5;
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // A slowly evolving noise field bends both the waves and their color flow.
  const fragmentSource = `
    precision highp float;
    varying vec2 uv;
    uniform float time;
    uniform float aspect;

    float hash(vec2 p) {
      p = fract(p * vec2(0.1031, 0.1030));
      p += dot(p, p.yx + 33.33);
      return fract((p.x + p.y) * p.x);
    }

    vec2 gradient(vec2 cell) {
      return vec2(hash(cell), hash(cell + vec2(19.3, 5.7))) * 2.0 - 1.0;
    }

    float noise(vec2 p) {
      vec2 cell = floor(p);
      vec2 f = fract(p);
      // Quintic interpolation keeps the noise smooth across cell boundaries.
      vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
      return mix(
        mix(dot(gradient(cell), f),
          dot(gradient(cell + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(gradient(cell + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(gradient(cell + vec2(1.0)), f - vec2(1.0)), u.x),
        u.y
      ) * 1.7;
    }

    float flowNoise(vec2 p) {
      mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
      float value = 0.75 * noise(p);
      p = turn * p * 1.93 + vec2(3.1, 7.4);
      return value + 0.25 * noise(p);
    }

    void main() {
      float t = time;
      float scale = clamp(aspect * 0.35, 0.8, 1.6);

      // Wave controls: 0.5 = half speed, 1.0 = current speed, 2.0 = double.
      const float waveSpeed = 1.0;
      const float waveWarp = 1.1;
      const float waveHeight = 0.38;
      float waveTime = t * waveSpeed;

      // Time is a dimension of the field, so its shape evolves continuously.
      // The second noise layer stretches and bends the first one's coordinates.
      vec2 field = vec2(uv.x * 2.2 * scale + uv.y * 0.18, waveTime * 0.13 + uv.y * 0.22);
      vec2 flow = vec2(
        flowNoise(field + vec2(1.7, 4.3)),
        flowNoise(field + vec2(8.1, 2.6))
      );
      vec2 bent = field + waveWarp * flow;
      float profile = flowNoise(bent + vec2(3.8, 6.1));

      // The same flow bends the palette through the body of each wave.
      float p = uv.x
        + 0.20 * flow.x
        + 0.07 * noise(vec2(bent.x, uv.y * 1.4 - waveTime * 0.12));
      float a = p - (0.02 + 0.07 * sin(t * 0.31));
      float b = p - (0.34 + 0.08 * cos(t * 0.27));
      float c = p - (0.68 + 0.08 * sin(t * 0.29));
      float d = p - (1.02 + 0.07 * cos(t * 0.25));
      float wa = exp(-9.0 * a * a);
      float wb = exp(-10.0 * b * b);
      float wc = exp(-9.0 * c * c);
      float wd = exp(-10.0 * d * d);

      // main colors
      vec3 color1 = vec3(0.4, 0.45, 0.58);
      vec3 color2 = vec3(0.19, 0.49, 0.70);
      vec3 color3 = vec3(0.48, 0.49, 0.88);
      vec3 color4 = vec3(0.40, 0.73, 0.88);
      vec3 color = (color1 * wa + color2 * wb + color3 * wc + color4 * wd)
        / (wa + wb + wc + wd);

      // Uneven crests grow, flatten, and merge as the warped field evolves.
      float reach = 0.46 + waveHeight * profile;
      float billow = 0.09 * noise(bent + vec2(uv.y * 1.3, -waveTime * 0.06));
      float warpedY = uv.y + billow * smoothstep(0.0, 0.35, uv.y);

      // A diffuse falloff avoids a visible contour or hard wave outline.
      float height = max(warpedY, 0.0) / max(reach, 0.10);
      float fade = exp(-1.5 * height * height);
      fade *= 1.0 - smoothstep(0.78, 1.0, uv.y);
      gl_FragColor = vec4(color, fade * 0.94);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const timeLocation = gl.getUniformLocation(program, "time");
  const aspectLocation = gl.getUniformLocation(program, "aspect");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let animation = 0;
  let lastFrame = 0;
  let elapsed = 0;

  function draw() {
    // SPEED
    gl.uniform1f(timeLocation, elapsed * 0.00036);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function resize() {
    // A soft gradient does not need a high-density drawing buffer.
    const width = Math.max(1, Math.round(canvas.clientWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight));
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform1f(aspectLocation, width / height);
    draw();
  }

  function frame(now) {
    animation = requestAnimationFrame(frame);
    if (now - lastFrame < 1000 / 30) return;
    if (lastFrame) elapsed += Math.min(now - lastFrame, 100);
    lastFrame = now;
    draw();
  }

  function updateMotion() {
    cancelAnimationFrame(animation);
    lastFrame = 0;
    if (!reducedMotion.matches && !document.hidden) {
      animation = requestAnimationFrame(frame);
    } else {
      draw();
    }
  }

  resize();
  floor.classList.add("is-ready");
  new ResizeObserver(resize).observe(floor);
  reducedMotion.addEventListener("change", updateMotion);
  document.addEventListener("visibilitychange", updateMotion);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    cancelAnimationFrame(animation);
    floor.classList.remove("is-ready");
  });
  updateMotion();
})();
