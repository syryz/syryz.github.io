# syrys

A static personal homepage for GitHub Pages: a name in Hack and an animated gradient along the bottom. No dependencies or build step.

## Publish

The homepage is `index.html`. Publish the repository root, including:

- `index.html`
- `styles.css`
- `script.js`
- `favicon.ico`
- `favicon.png`
- `favicon.svg`
- `.nojekyll`
- `assets/fonts/hack/hack-regular.woff2`
- `assets/fonts/hack/LICENSE.md`

All asset paths are relative, so the site works at a custom domain or under a GitHub Pages repository path. All fonts and scripts are hosted locally. The gradient uses browser-side WebGL, with an animated CSS fallback when WebGL or JavaScript is unavailable. It respects reduced motion and pauses while the page is hidden.

The homepage follows the system's light or dark appearance automatically, including
live changes. Dark mode uses a charcoal background, light text, and a softer
gradient. Browser theme colors match each appearance; no JavaScript is needed to
select the theme.

## Customize

Edit the name, title, and description in `index.html`. Styles are in `styles.css`.

The wave controls are together inside the shader in `script.js`:

```glsl
const float waveSpeed = 2.0;
const float waveWarp = 1.35;
const float waveHeight = 0.44;
const float waveVariance = 0.8;
const float blendHeight = 0.24;
const float layerBlend = 0.55;
```

- `waveSpeed`: speed of the wave deformation. `0.5` is half speed, `2.0` is double, and `0.0` freezes the wave shapes while the palette can still drift.
- `waveWarp`: how much the rounded layers bend and change shape.
- `waveHeight`: the height of their rounded swells. Three overlapping layers drift independently, with a soft glow joining them at the bottom.
- `waveVariance`: how much each layer's height and lateral opacity vary. `0.0` gives continuous coverage; the default `0.8` adds moving pockets of translucency so overlapping waves do not form a uniformly bright strip at the bottom.
- `blendHeight`: vertical softness of the transition into the background, relative to the gradient canvas height. `0.12` is more defined, `0.24` is the softer default, and `0.35` gives a broader, mistier fade. It also gently extends the fluid glow; the overall gradient stays anchored to the bottom.
- `layerBlend`: balance between the fluid mesh glow (`0.0`) and rounded stacked waves (`1.0`). The default `0.55` blends both, with softly deforming layer edges.

`color1` through `color4` set the palette using RGB values between 0 and 1. The `elapsed * 0.00036` multiplier in `draw()` sets the overall animation speed, including both the waves and palette drift.

The CSS fallback's colors, duration, `--gradient-wave-speed`, and `--gradient-blend-height` are custom properties near the top of `styles.css`. Match `--gradient-wave-speed` to the shader's `waveSpeed` (currently `2`). Set `--gradient-blend-height` to the same number as the shader's `blendHeight` (currently `0.24`); it controls both the blur and the height of the background fade. RGB percentages correspond to the shader's 0–1 RGB values. Its shapes and pace approximate the shader.

Hack v3.003 comes from [Source Foundry's Hack project](https://github.com/source-foundry/Hack/tree/v3.003). The font license is bundled beside the font files.

## Preview

Open `index.html` directly, or serve the repository:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8000/`.

## Reading design

`reading.html` and `reading.css` preserve the open-book design. The homepage and its styles and script live at the repository root. Fonts and their license are in `assets/fonts/hack/`.

## Public-view experiment

Open `test.html` to preview the supplied Directus public-view layout without Vue,
Pinia, or a build step. `test.css` preserves its three blurred shapes, keyframes,
and 33/19/27-second animation durations. The art appears beside the 500px content
panel when space is available; below 500px only the content is shown.

Edit `settings` in `test.js` for project branding, image/video backgrounds,
foreground artwork, a plain-text public note, or the wider content panel. The
local `getAppearance()` maps editable colors and speed onto CSS custom properties;
the original `@/utils/get-appearance` source was not provided. `artSpeed: 0`
pauses the shapes. The page respects reduced motion and pauses animation/video
when hidden. Relative asset paths work without a server; Directus file IDs need
an `assetBaseUrl` ending in `/assets/`. The existing homepage is unchanged.
