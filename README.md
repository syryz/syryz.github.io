# syrys

A static personal homepage for GitHub Pages: a name in Hack and an animated gradient along the bottom. No dependencies or build step.

## Publish

The homepage is `index.html`. Publish the repository root, including:

- `index.html`
- `styles.css`
- `script.js`
- `favicon.svg`
- `.nojekyll`
- `assets/fonts/hack/hack-regular.woff2`
- `assets/fonts/hack/LICENSE.md`

All asset paths are relative, so the site works at a custom domain or under a GitHub Pages repository path. All fonts and scripts are hosted locally. The gradient uses browser-side WebGL, with an animated CSS fallback when WebGL or JavaScript is unavailable. It respects reduced motion and pauses while the page is hidden.

## Customize

Edit the name, title, and description in `index.html`. Styles are in `styles.css`.

The wave controls are together inside the shader in `script.js`:

```glsl
const float waveSpeed = 1.0;
const float waveWarp = 1.1;
const float waveHeight = 0.38;
```

- `waveSpeed`: speed of the wave deformation. `0.5` is half speed, `2.0` is double, and `0.0` freezes the wave shapes while the palette can still drift.
- `waveWarp`: how much the waves bend and change shape.
- `waveHeight`: the size of their rises and dips.

`color1` through `color4` set the palette using RGB values between 0 and 1. The `elapsed * 0.00036` multiplier in `draw()` sets the overall animation speed, including both the waves and palette drift.

The CSS fallback's colors and duration are custom properties near the top of `styles.css`. RGB percentages correspond to the shader's 0–1 RGB values. Its shapes and pace approximate the shader.

Hack v3.003 comes from [Source Foundry's Hack project](https://github.com/source-foundry/Hack/tree/v3.003). The font license is bundled beside the font files.

## Preview

Open `index.html` directly, or serve the repository:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000/`.

## Reading design

`reading.html` and `reading.css` preserve the open-book design. The homepage and its styles and script live at the repository root. Fonts and their license are in `assets/fonts/hack/`.
# syryz.github.io
