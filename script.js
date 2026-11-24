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

  // Rounded swells dissolve into an evolving, fluid color field.
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

    float swell(float x, float center, float width) {
      float distance = (x - center) / width;
      return exp(-2.0 * distance * distance);
    }

    void main() {
      float t = time;
      float scale = clamp(aspect * 0.35, 0.8, 1.6);

      // Wave controls: 0.5 = half the original pace, 2.0 = double.
      const float waveSpeed = 2.0;
      const float waveWarp = 1.35;
      const float waveHeight = 0.44;
      // Moving gaps in each layer's coverage prevent a solid bright floor.
      const float waveVariance = 0.8;
      // Vertical fade width: larger values dissolve the waves more gradually.
      const float blendHeight = 0.24;
      // 0.0 = fluid glow, 1.0 = stacked rounded layers.
      const float layerBlend = 0.55;
      float waveTime = t * waveSpeed;

      // Time is a dimension of the field, so its shape evolves continuously.
      // The second noise layer stretches and bends the first one's coordinates.
      vec2 field = vec2(uv.x * 2.2 * scale + uv.y * 0.18, waveTime * 0.13 + uv.y * 0.22);
      vec2 flow = vec2(
        flowNoise(field + vec2(1.7, 4.3)),
        flowNoise(field + vec2(8.1, 2.6))
      );
      vec2 bent = field + waveWarp * flow;

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

      // Three broad, rounded layers overlap at different heights.
      // Their centers and widths drift independently, letting the swells merge.
      float x = uv.x + 0.08 * waveWarp * flow.x;
      float y = uv.y + 0.035 * waveWarp
        * noise(vec2(x * 2.1, waveTime * 0.12 + uv.y));
      float back = 0.22 + waveHeight * (
        (0.78 + 0.18 * waveVariance * sin(waveTime * 0.23)) * swell(x, 0.18 + 0.24 * sin(waveTime * 0.15 + 0.2), 0.46 + 0.09 * cos(waveTime * 0.14))
        + 0.63 * swell(x, 0.93 + 0.17 * cos(waveTime * 0.18), 0.42 + 0.05 * sin(waveTime * 0.16))
      );
      float middle = 0.12 + waveHeight * (
        (0.78 + 0.20 * waveVariance * cos(waveTime * 0.19 + 0.8)) * swell(x, 0.55 + 0.28 * sin(waveTime * 0.18 + 1.2), 0.39 + 0.09 * cos(waveTime * 0.12))
        + 0.40 * swell(x, -0.16 + 0.14 * cos(waveTime * 0.21), 0.43)
      );
      float front = 0.025 + waveHeight * (
        (0.64 + 0.18 * waveVariance * sin(waveTime * 0.27 + 1.7)) * swell(x, 0.18 + 0.29 * cos(waveTime * 0.20), 0.42)
        + 0.60 * swell(x, 1.08 + 0.20 * sin(waveTime * 0.17), 0.40)
      );
      // Each layer deforms a little differently inside the shared flow.
      back += 0.055 * waveWarp * noise(bent + vec2(2.1, 7.4));
      middle += 0.065 * waveWarp * noise(bent + vec2(6.3, 1.8));
      front += 0.045 * waveWarp * noise(bent + vec2(4.7, 5.2));

      // A diffuse halo joins the layers into the existing bottom glow.
      float alpha = 0.12 * exp(-2.0 * uv.y * uv.y / 0.25);
      vec3 blended = color * alpha;
      float feather = max(blendHeight, 0.001);
      float backAlpha = (1.0 - smoothstep(back - feather * 1.1, back + feather * 1.1, y)) * 0.40;
      float middleAlpha = (1.0 - smoothstep(middle - feather, middle + feather, y)) * 0.62;
      float frontAlpha = (1.0 - smoothstep(front - feather * 0.9, front + feather * 0.9, y)) * 0.76;

      // Independent lateral envelopes keep each swell locally translucent,
      // including at the bottom where all three height masks would be opaque.
      float backCoverage = 0.35 + 0.65 * swell(x, -0.05 + 0.50 * sin(waveTime * 0.13 + 0.3), 0.60);
      float middleCoverage = 0.30 + 0.70 * swell(x, 0.75 + 0.40 * cos(waveTime * 0.16 + 1.5), 0.53);
      float frontCoverage = 0.22 + 0.78 * (
        0.70 * swell(x, 0.40 + 0.35 * sin(waveTime * 0.19 + 2.0), 0.38)
        + 0.30 * swell(x, 1.10 + 0.30 * cos(waveTime * 0.12), 0.40)
      );
      backAlpha *= mix(1.0, backCoverage, waveVariance);
      middleAlpha *= mix(1.0, middleCoverage, waveVariance);
      frontAlpha *= mix(1.0, frontCoverage, waveVariance);

      blended = mix(color, color3, 0.35) * backAlpha + blended * (1.0 - backAlpha);
      alpha = backAlpha + alpha * (1.0 - backAlpha);
      blended = mix(color, color4, 0.35) * middleAlpha + blended * (1.0 - middleAlpha);
      alpha = middleAlpha + alpha * (1.0 - middleAlpha);
      blended = mix(color, color2, 0.20) * frontAlpha + blended * (1.0 - frontAlpha);
      alpha = frontAlpha + alpha * (1.0 - frontAlpha);

      // Blend the rounded stack with the earlier, continuously billowing mesh.
      float profile = flowNoise(bent + vec2(3.8, 6.1));
      float reach = 0.46 + waveHeight * profile + feather * 0.25;
      float billow = 0.09 * noise(bent + vec2(uv.y * 1.3, -waveTime * 0.06));
      float warpedY = uv.y + billow * smoothstep(0.0, 0.35, uv.y);
      float height = max(warpedY, 0.0) / max(reach, 0.10);
      float fluidAlpha = exp(-1.5 * height * height);
      float fluidCoverage = 0.35 + 0.65 * clamp(
        0.5 + noise(vec2(x * 2.0 + 2.1, waveTime * 0.19 + 3.7)), 0.0, 1.0
      );
      fluidAlpha *= mix(1.0, fluidCoverage, waveVariance);
      blended = mix(color * fluidAlpha, blended, layerBlend);
      alpha = mix(fluidAlpha, alpha, layerBlend);

      vec3 finalColor = blended / max(alpha, 0.001);
      alpha *= 1.0 - smoothstep(0.72, 1.0, uv.y);
      gl_FragColor = vec4(finalColor, alpha * 0.94);
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
