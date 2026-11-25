(() => {
  // Local stand-ins for the server store and @/utils/get-appearance.
  // Asset values may be relative paths or absolute URLs. Set assetBaseUrl to
  // a Directus URL ending in /assets/ to use file IDs instead.
  const settings = {
    wide: false,
    assetBaseUrl: "",
    project: {
      project_name: "syrys",
      project_descriptor: "Application",
      project_color: "#6644ff",
      project_logo: null,
      public_background: null, // { id: "assets/background.jpg", type: "image/jpeg" }
      public_foreground: null,
      public_note: null, // Plain text, with optional line breaks.
    },
    appearance: {
      background: "#fcfcfd",
      foreground: "#272b34",
      subdued: "#6b7280",
      artBackground: "#fcfcfd",
      artPrimary: "#6644ff",
      artSecondary: "#ff99dd",
      artSpeed: 1, // 0 freezes the shapes; 2 doubles their speed.
    },
  };

  function getAppearance(appearance) {
    return {
      "--theme--public--background": appearance.background,
      "--theme--public--foreground": appearance.foreground,
      "--theme--foreground-subdued": appearance.subdued,
      "--theme--public--art--background": appearance.artBackground,
      "--theme--public--art--primary": appearance.artPrimary,
      "--theme--public--art--secondary": appearance.artSecondary,
      // Keep animation-duration valid even when speed is zero.
      "--theme--public--art--speed": Math.max(Number(appearance.artSpeed) || 0, 0.001),
    };
  }

  function getAssetUrl(asset) {
    if (!asset) return null;
    const path = String(asset);
    const base = settings.assetBaseUrl;
    return base ? new URL(path, new URL(base, document.baseURI)).href : path;
  }

  const root = document.documentElement;
  const { project, appearance } = settings;
  for (const [property, value] of Object.entries(getAppearance(appearance))) {
    root.style.setProperty(property, value);
  }
  if (project.project_color) root.style.setProperty("--project-color", project.project_color);
  document.querySelector(".container").classList.toggle("wide", settings.wide);
  document.querySelector("#project-name").textContent = project.project_name;
  document.querySelector("#project-descriptor").textContent = project.project_descriptor ?? "Application";
  document.title = `${project.project_name || "Application"} — public view`;

  const logo = document.querySelector("#project-logo");
  logo.alt = project.project_name || "Logo";
  if (project.project_logo) {
    logo.addEventListener("error", () => { logo.src = "favicon.svg"; }, { once: true });
    logo.src = getAssetUrl(project.project_logo);
  }

  const fallback = document.querySelector(".fallback");
  const image = document.querySelector("#background-image");
  const video = document.querySelector("#background-video");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const artVisible = matchMedia("(min-width: 500px)");

  if (project.public_background?.id) {
    const isVideo = project.public_background.type?.startsWith("video/");
    const background = isVideo ? video : image;
    // Keep the gradient until custom media successfully loads, and restore it
    // if a video later fails. Video URLs are never used as CSS image URLs.
    background.addEventListener(isVideo ? "loadeddata" : "load", () => {
      fallback.hidden = true;
      background.hidden = false;
    });
    background.addEventListener("error", () => {
      fallback.hidden = false;
      background.hidden = true;
    });
    if (isVideo) {
      video.muted = true;
      video.autoplay = !reducedMotion.matches && !document.hidden && artVisible.matches;
    }
    background.src = getAssetUrl(project.public_background.id);
  }

  if (project.public_foreground) {
    const foreground = document.querySelector("#foreground");
    foreground.alt = project.project_name || "";
    foreground.addEventListener("load", () => { foreground.hidden = false; });
    foreground.addEventListener("error", () => { foreground.hidden = true; });
    foreground.src = getAssetUrl(project.public_foreground);
  }

  if (project.public_note) {
    const note = document.querySelector("#public-note");
    note.textContent = project.public_note;
    note.hidden = false;
  }

  function updateMotion() {
    root.classList.toggle("is-paused", document.hidden || Number(appearance.artSpeed) <= 0 || !artVisible.matches);
    if (document.hidden || reducedMotion.matches || !artVisible.matches) {
      video.autoplay = false;
      video.pause();
    } else if (video.getAttribute("src")) {
      video.autoplay = true;
      // A browser may block autoplay; the media's first frame remains visible.
      video.play().catch(() => {});
    }
  }

  document.addEventListener("visibilitychange", updateMotion);
  reducedMotion.addEventListener("change", updateMotion);
  artVisible.addEventListener("change", updateMotion);
  updateMotion();
})();
