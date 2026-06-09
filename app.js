const audio = document.querySelector("#audio");
const audioFile = document.querySelector("#audioFile");
const captureButton = document.querySelector("#captureButton");
const captureButtonLabel = document.querySelector("#captureButtonLabel");
const captureButtonHint = document.querySelector("#captureButtonHint");
const playButton = document.querySelector("#playButton");
const seekBar = document.querySelector("#seekBar");
const canvas = document.querySelector("#visualizer");
const canvasEmpty = document.querySelector("#canvasEmpty");
const ctx = canvas.getContext("2d");
const visualizerPanel = document.querySelector(".visualizer-panel");
const canvasWrap = document.querySelector(".canvas-wrap");
const visualFps = document.querySelector("#visualFps");
const visualModeLabel = document.querySelector("#visualModeLabel");
const expandVisualizer = document.querySelector("#expandVisualizer");
const exitFullscreen = document.querySelector("#exitFullscreen");
const sensitivityControl = document.querySelector("#sensitivityControl");
const smoothingControl = document.querySelector("#smoothingControl");
const intensityControl = document.querySelector("#intensityControl");
const motionControl = document.querySelector("#motionControl");
const sensitivityValue = document.querySelector("#sensitivityValue");
const smoothingValue = document.querySelector("#smoothingValue");
const intensityValue = document.querySelector("#intensityValue");
const motionValue = document.querySelector("#motionValue");
const overlayToggle = document.querySelector("#overlayToggle");
const beatFxToggle = document.querySelector("#beatFxToggle");
const neonLightsToggle = document.querySelector("#neonLightsToggle");
const colorRainToggle = document.querySelector("#colorRainToggle");
const geometryToggle = document.querySelector("#geometryToggle");
const fractalsToggle = document.querySelector("#fractalsToggle");
const macroToggle = document.querySelector("#macroToggle");
const bassStutterToggle = document.querySelector("#bassStutterToggle");
const tripVisualsToggle = document.querySelector("#tripVisualsToggle");
const depth3dToggle = document.querySelector("#depth3dToggle");
const resetControls = document.querySelector("#resetControls");
const directorToggle = document.querySelector("#directorToggle");
const directorStatus = document.querySelector("#directorStatus");
const recordButton = document.querySelector("#recordButton");
const recordStatus = document.querySelector("#recordStatus");
const exportPreset = document.querySelector("#exportPreset");
const importPreset = document.querySelector("#importPreset");
const presetStatus = document.querySelector("#presetStatus");
const customColor = document.querySelector("#customColor");
const moodSwatches = document.querySelectorAll(".mood-swatch");
const styleOptions = document.querySelectorAll(".style-option");

const fileName = document.querySelector("#fileName");
const fileType = document.querySelector("#fileType");
const fileSize = document.querySelector("#fileSize");
const duration = document.querySelector("#duration");
const currentTime = document.querySelector("#currentTime");
const totalTime = document.querySelector("#totalTime");
const systemStatus = document.querySelector("#systemStatus");
const visualizerTitle = document.querySelector("#visualizerTitle");

const bassValue = document.querySelector("#bassValue");
const bassMeter = document.querySelector("#bassMeter");
const bassLabel = document.querySelector("#bassLabel");
const peakValue = document.querySelector("#peakValue");
const peakMeter = document.querySelector("#peakMeter");
const peakLight = document.querySelector("#peakLight");

let audioContext;
let mediaElementSource;
let captureSource;
let captureStream;
let analyser;
let frequencyData;
let waveformData;
let animationId;
let objectUrl;
let activeSource = "none";
let stoppingCapture = false;
let visualizationMode = "frequency";
let smoothedEnergy = 0;
let lastFrameTime = performance.now();
let fpsSampleTime = performance.now();
let fpsFrames = 0;
let peakCaps = [];
let lastHistoryCapture = 0;
let previousBassPulse = 0;
let lastBeatTime = 0;
let bassStutterLevel = 0;
let bassStutterPhase = 0;
let directorActive = false;
let directorSceneIndex = -1;
let lastDirectorChange = 0;
let mediaRecorder;
let recordedChunks = [];
const particles = [];
const colorDrops = Array.from({ length: 58 }, (_, index) => ({
  x: ((index * 73) % 101) / 100,
  y: ((index * 41) % 113) / 113,
  speed: 0.22 + ((index * 29) % 100) / 95,
  length: 7 + ((index * 17) % 24),
  width: 0.45 + ((index * 11) % 9) / 10,
  hue: ((index * 37) % 100) / 100,
  band: (index * 13) % 110,
}));
const macroForms = [
  { type: "orb", x: -0.2, y: 0.24, scale: 0.62, speed: 0.000018, band: 4, hue: 0.08 },
  { type: "ring", x: 1.18, y: 0.7, scale: 0.78, speed: -0.000014, band: 18, hue: 0.42 },
  { type: "slab", x: 0.52, y: -0.28, scale: 0.68, speed: 0.000011, band: 48, hue: 0.72 },
  { type: "orb", x: 0.72, y: 1.2, scale: 0.54, speed: -0.000016, band: 82, hue: 0.9 },
];
const spectrumHistory = [];
const shockwaves = [];
const arcBursts = [];
const signalNodes = Array.from({ length: 18 }, (_, index) => ({
  x: ((index * 47) % 101) / 100,
  y: (17 + ((index * 31) % 67)) / 100,
  phase: index * 0.73,
  band: index % 12,
}));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const controlDefaults = {
  sensitivity: 1,
  smoothing: 0.82,
  intensity: 1,
  motion: 1,
  overlays: true,
  beatFx: true,
  neonLights: true,
  colorRain: true,
  geometry: true,
  fractals: true,
  macro: true,
  bassStutter: true,
  tripVisuals: true,
  depth3d: true,
  mood: "neon",
  accent: "#b7ff33",
  style: "cyber",
};
let visualControls = { ...controlDefaults };
const moodPalettes = {
  neon: { accent: "#b7ff33", warning: "#ffcc33" },
  cyan: { accent: "#33e6ff", warning: "#b7ff33" },
  magenta: { accent: "#ff4297", warning: "#33e6ff" },
  amber: { accent: "#ffb52e", warning: "#ff5f56" },
  prismatic: { accent: "#a970ff", warning: "#33e6ff" },
  oil: { accent: "#00d6ad", warning: "#d22cff" },
};
const directorScenes = [
  {
    name: "PRISMATIC DRIVE",
    mode: "frequency",
    controls: {
      mood: "prismatic",
      style: "cyber",
      intensity: 1.28,
      motion: 1.12,
      neonLights: true,
      colorRain: true,
      geometry: true,
      fractals: false,
      macro: true,
      bassStutter: true,
      tripVisuals: false,
      depth3d: true,
    },
  },
  {
    name: "LIQUID ORBIT",
    mode: "orbit",
    controls: {
      mood: "oil",
      style: "aurora",
      intensity: 1.18,
      motion: 0.82,
      neonLights: true,
      colorRain: false,
      geometry: true,
      fractals: true,
      macro: true,
      bassStutter: false,
      tripVisuals: true,
      depth3d: true,
    },
  },
  {
    name: "LASER DROP",
    mode: "frequency",
    controls: {
      mood: "magenta",
      style: "laser",
      intensity: 1.46,
      motion: 1.35,
      neonLights: true,
      colorRain: true,
      geometry: false,
      fractals: false,
      macro: false,
      bassStutter: true,
      tripVisuals: false,
      depth3d: true,
    },
  },
  {
    name: "FRACTAL FIELD",
    mode: "field",
    controls: {
      mood: "cyan",
      style: "hologram",
      intensity: 1.05,
      motion: 0.7,
      neonLights: false,
      colorRain: true,
      geometry: true,
      fractals: true,
      macro: false,
      bassStutter: false,
      tripVisuals: true,
      depth3d: true,
    },
  },
  {
    name: "DEEP SIGNAL",
    mode: "waveform",
    controls: {
      mood: "amber",
      style: "minimal",
      intensity: 0.88,
      motion: 0.52,
      neonLights: false,
      colorRain: false,
      geometry: false,
      fractals: true,
      macro: true,
      bassStutter: false,
      tripVisuals: false,
      depth3d: true,
    },
  },
];
const visualStyleProfiles = {
  cyber: {
    barMode: "solid",
    glow: 1,
    reflection: 1,
    waveformLayers: 3,
    overlayDensity: 1,
  },
  hologram: {
    barMode: "wire",
    glow: 0.62,
    reflection: 0.25,
    waveformLayers: 2,
    overlayDensity: 0.72,
  },
  laser: {
    barMode: "laser",
    glow: 1.55,
    reflection: 0,
    waveformLayers: 1,
    overlayDensity: 0.48,
  },
  minimal: {
    barMode: "minimal",
    glow: 0.12,
    reflection: 0,
    waveformLayers: 1,
    overlayDensity: 0.08,
  },
  aurora: {
    barMode: "aurora",
    glow: 1.2,
    reflection: 0.55,
    waveformLayers: 3,
    overlayDensity: 0.82,
  },
};

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatBytes = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * pixelRatio);
  canvas.height = Math.floor(rect.height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function getThemeColor(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  };
}

function applyColorMood() {
  const palette =
    visualControls.mood === "custom"
      ? { accent: visualControls.accent, warning: "#ffffff" }
      : moodPalettes[visualControls.mood] || moodPalettes.neon;
  const rgb = hexToRgb(palette.accent);

  visualControls.accent = palette.accent;
  document.body.style.setProperty("--accent", palette.accent);
  document.body.style.setProperty(
    "--accent-rgb",
    `${rgb.red}, ${rgb.green}, ${rgb.blue}`
  );
  document.body.style.setProperty("--warning", palette.warning);
  document.body.style.setProperty(
    "--line",
    `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.2)`
  );
  document.body.style.setProperty(
    "--grid",
    `rgba(${rgb.red}, ${rgb.green}, ${rgb.blue}, 0.035)`
  );
  customColor.value = palette.accent;

  moodSwatches.forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === visualControls.mood);
  });
  canvasWrap.dataset.mood = visualControls.mood;
}

function isPrismatic() {
  return visualControls.mood === "prismatic" || visualControls.mood === "oil";
}

function isOilSlick() {
  return visualControls.mood === "oil";
}

function prismaticColor(position, time, alpha = 1, offset = 0) {
  if (isOilSlick()) {
    const phase =
      position * 9.5 +
      time * 0.0011 +
      Math.sin(position * 18 - time * 0.0007) * 1.6 +
      offset * 0.025;
    const hue =
      (205 + Math.sin(phase) * 105 + Math.sin(phase * 0.43) * 54 + 360) % 360;
    const saturation = 82 + Math.sin(phase * 1.7) * 12;
    const lightness = 48 + Math.cos(phase * 0.78) * 13;
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
  }

  const hue = (time * 0.006 + position * 310 + offset) % 360;
  const saturation = 88 + Math.sin(position * Math.PI * 2) * 7;
  const lightness = 56 + Math.sin(time * 0.0018 + position * 8) * 7;
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

function prismaticGradient(context, x0, y0, x1, y1, time, alpha = 1) {
  const gradient = context.createLinearGradient(x0, y0, x1, y1);
  const step = isOilSlick() ? 0.125 : 0.2;
  for (let stop = 0; stop <= 1; stop += step) {
    gradient.addColorStop(stop, prismaticColor(stop, time, alpha));
  }
  return gradient;
}

function drawLiquidMembrane(width, height, energy, time) {
  if (!isOilSlick() || reducedMotion) return;

  const bass = frequencyData?.[4] / 255 || 0;
  const mid = frequencyData?.[34] / 255 || 0;
  const layers = 4;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let layer = 0; layer < layers; layer += 1) {
    const depth = layer / (layers - 1);
    const baseline = height * (0.32 + depth * 0.15);
    const amplitude =
      height * (0.035 + energy * 0.08 + bass * 0.045) * (1 - depth * 0.2);
    const speed = time * (0.00032 + layer * 0.000045);
    const points = Math.max(48, Math.floor(width / 12));

    ctx.beginPath();
    for (let index = 0; index <= points; index += 1) {
      const ratio = index / points;
      const sampleIndex = Math.min(
        waveformData.length - 1,
        Math.floor(ratio * (waveformData.length - 1))
      );
      const audioRipple =
        ((waveformData[sampleIndex] - 128) / 128) * amplitude * 0.42;
      const broadWave =
        Math.sin(ratio * Math.PI * (3.2 + layer * 0.75) + speed * 7) * amplitude;
      const interference =
        Math.cos(ratio * Math.PI * (7.5 - layer * 0.6) - speed * 4.2) *
        amplitude *
        (0.22 + mid * 0.32);
      const x = ratio * width;
      const y = baseline + broadWave + interference + audioRipple;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height * 0.74);
    ctx.lineTo(0, height * 0.74);
    ctx.closePath();

    const liquid = ctx.createLinearGradient(
      0,
      baseline - amplitude,
      width,
      baseline + amplitude
    );
    for (let stop = 0; stop <= 1; stop += 0.125) {
      liquid.addColorStop(
        stop,
        prismaticColor(
          stop + depth * 0.18,
          time,
          0.025 + (1 - depth) * 0.035 + energy * 0.035
        )
      );
    }
    ctx.fillStyle = liquid;
    ctx.shadowColor = prismaticColor(depth, time, 0.32);
    ctx.shadowBlur = 18 + energy * 30;
    ctx.fill();

    ctx.globalAlpha = 0.18 + energy * 0.26;
    ctx.strokeStyle = prismaticGradient(
      ctx,
      0,
      0,
      width,
      0,
      time + layer * 240,
      0.72
    );
    ctx.lineWidth = 0.7 + (1 - depth) * 0.9;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const lensX = width * (0.5 + Math.sin(time * 0.00036) * 0.24);
  const lensY = height * (0.48 + Math.cos(time * 0.00029) * 0.12);
  const lensRadius = Math.min(width, height) * (0.16 + energy * 0.08);
  const lens = ctx.createRadialGradient(lensX, lensY, 0, lensX, lensY, lensRadius);
  lens.addColorStop(0, prismaticColor(0.1, time, 0.12 + energy * 0.12));
  lens.addColorStop(0.42, prismaticColor(0.48, time, 0.055));
  lens.addColorStop(0.72, prismaticColor(0.82, time, 0.025));
  lens.addColorStop(1, "transparent");
  ctx.fillStyle = lens;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawNeonLights(width, height, energy, time) {
  if (!visualControls.neonLights || reducedMotion) return;

  const style = getVisualStyle();
  const beamEnergy = 0.15 + energy * 0.85;
  const fixedColors = ["51, 230, 255", "255, 66, 151", "183, 255, 51"];

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let index = 0; index < 3; index += 1) {
    const phase = time * (0.00022 + index * 0.000035) + index * 2.1;
    const startX = width * (0.18 + index * 0.31) + Math.sin(phase) * width * 0.08;
    const endX = width * (0.82 - index * 0.27) + Math.cos(phase * 0.83) * width * 0.1;
    const color = isPrismatic()
      ? prismaticColor(index / 3, time, 1, index * 35)
      : `rgb(${fixedColors[index]})`;
    const beam = ctx.createLinearGradient(startX, 0, endX, height);
    beam.addColorStop(0, "transparent");
    beam.addColorStop(0.35, color);
    beam.addColorStop(0.68, color);
    beam.addColorStop(1, "transparent");

    ctx.globalAlpha = (0.025 + energy * 0.055) * style.glow;
    ctx.strokeStyle = beam;
    ctx.lineWidth = 18 + energy * 26;
    ctx.shadowColor = color;
    ctx.shadowBlur = 34 + energy * 45;
    ctx.beginPath();
    ctx.moveTo(startX, -height * 0.08);
    ctx.bezierCurveTo(
      width * (0.25 + index * 0.18),
      height * 0.28,
      width * (0.75 - index * 0.17),
      height * 0.68,
      endX,
      height * 1.08
    );
    ctx.stroke();

    ctx.globalAlpha = (0.16 + energy * 0.3) * Math.min(style.glow, 1.2);
    ctx.lineWidth = 0.65 + beamEnergy * 0.9;
    ctx.shadowBlur = 12 + energy * 20;
    ctx.stroke();
  }

  const edgeColorLeft = isPrismatic()
    ? prismaticColor(0.16, time, 0.7)
    : "rgba(51, 230, 255, 0.7)";
  const edgeColorRight = isPrismatic()
    ? prismaticColor(0.76, time, 0.7)
    : "rgba(255, 66, 151, 0.7)";
  const pulse = 0.18 + energy * 0.48;

  ctx.globalAlpha = pulse;
  ctx.lineWidth = 1;
  ctx.shadowBlur = 18 + energy * 30;
  ctx.strokeStyle = edgeColorLeft;
  ctx.shadowColor = edgeColorLeft;
  ctx.beginPath();
  ctx.moveTo(1, height * 0.16);
  ctx.lineTo(1, height * 0.84);
  ctx.stroke();

  ctx.strokeStyle = edgeColorRight;
  ctx.shadowColor = edgeColorRight;
  ctx.beginPath();
  ctx.moveTo(width - 1, height * 0.16);
  ctx.lineTo(width - 1, height * 0.84);
  ctx.stroke();
  ctx.restore();
}

function drawColorRain(width, height, energy, time, deltaTime) {
  if (!visualControls.colorRain || reducedMotion) return;

  const style = getVisualStyle();
  const density = Math.max(
    12,
    Math.floor(colorDrops.length * (0.35 + energy * 0.65) * style.overlayDensity)
  );

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  for (let index = 0; index < density; index += 1) {
    const drop = colorDrops[index];
    const magnitude =
      frequencyData?.[Math.min(drop.band, frequencyData.length - 1)] / 255 || 0;
    const velocity =
      drop.speed * (0.55 + visualControls.motion * 0.65 + magnitude * 1.35);
    drop.y += velocity * deltaTime * 0.0028;
    if (drop.y > 1.15) {
      drop.y = -0.15 - ((index * 19) % 20) / 100;
      drop.x = (drop.x + 0.37 + magnitude * 0.11) % 1;
    }

    const x = drop.x * width + Math.sin(time * 0.00045 + index) * 5;
    const y = drop.y * height;
    const streakLength = drop.length * (0.65 + magnitude * 1.25);
    const color = isPrismatic()
      ? prismaticColor(drop.hue, time, 0.42 + magnitude * 0.46, index * 5)
      : index % 3 === 0
        ? `rgba(51, 230, 255, ${0.32 + magnitude * 0.46})`
        : index % 3 === 1
          ? `rgba(255, 66, 151, ${0.3 + magnitude * 0.44})`
          : `rgba(${getThemeColor("--accent-rgb")}, ${0.3 + magnitude * 0.5})`;

    const streak = ctx.createLinearGradient(x, y - streakLength, x, y + 2);
    streak.addColorStop(0, "transparent");
    streak.addColorStop(0.72, color);
    streak.addColorStop(1, color);
    ctx.strokeStyle = streak;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4 + magnitude * 11;
    ctx.lineWidth = drop.width + magnitude * 0.7;
    ctx.globalAlpha = 0.3 + magnitude * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y - streakLength);
    ctx.lineTo(x, y);
    ctx.stroke();

    if (magnitude > 0.58) {
      ctx.globalAlpha = (magnitude - 0.5) * 0.7;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y + 1, 1.2 + magnitude, 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawGeometryLayer(width, height, energy, time) {
  if (!visualControls.geometry || reducedMotion) return;

  const style = getVisualStyle();
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * (0.16 + energy * 0.035);
  const rings = style.barMode === "minimal" ? 2 : 4;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = "lighter";

  for (let ring = rings; ring >= 1; ring -= 1) {
    const sides = 3 + ring * 2;
    const radius = baseRadius * (0.48 + ring * 0.38);
    const rotation = time * (ring % 2 ? 0.000055 : -0.00004) + ring * 0.34;
    const bandIndex = Math.min(
      frequencyData.length - 1,
      5 + ring * 19
    );
    const magnitude = frequencyData[bandIndex] / 255;

    ctx.beginPath();
    for (let vertex = 0; vertex <= sides; vertex += 1) {
      const ratio = vertex / sides;
      const angle = ratio * Math.PI * 2 + rotation;
      const vertexBand = Math.min(
        frequencyData.length - 1,
        bandIndex + (vertex % sides) * 3
      );
      const vertexEnergy = frequencyData[vertexBand] / 255;
      const reactiveRadius = radius * (1 + vertexEnergy * 0.13);
      const x = Math.cos(angle) * reactiveRadius;
      const y = Math.sin(angle) * reactiveRadius;
      if (vertex === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    const color = isPrismatic()
      ? prismaticColor(ring / rings, time, 0.24 + magnitude * 0.42, ring * 24)
      : `rgba(${getThemeColor("--accent-rgb")}, ${0.1 + magnitude * 0.34})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = (5 + magnitude * 14) * style.glow;
    ctx.lineWidth = 0.55 + magnitude * 0.9;
    ctx.stroke();

    if (ring > 1) {
      ctx.globalAlpha = 0.1 + magnitude * 0.18;
      for (let vertex = 0; vertex < sides; vertex += 1) {
        const angle = (vertex / sides) * Math.PI * 2 + rotation;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

function drawMacroLayer(width, height, energy, time) {
  if (!visualControls.macro || reducedMotion) return;

  const style = getVisualStyle();
  const shortSide = Math.min(width, height);

  ctx.save();
  ctx.globalCompositeOperation = isOilSlick() ? "screen" : "lighter";

  for (let index = 0; index < macroForms.length; index += 1) {
    const form = macroForms[index];
    const magnitude =
      frequencyData?.[Math.min(form.band, frequencyData.length - 1)] / 255 || 0;
    const phase = time * form.speed + index * 1.9;
    const driftX = Math.sin(phase * 1.7) * width * 0.2;
    const driftY = Math.cos(phase * 1.13) * height * 0.15;
    const x = form.x * width + driftX;
    const y = form.y * height + driftY;
    const radius =
      shortSide * form.scale * (0.82 + magnitude * 0.22 + energy * 0.08);
    const color = isPrismatic()
      ? prismaticColor(form.hue, time, 1, index * 47)
      : index % 2
        ? `rgb(${getThemeColor("--accent-rgb")})`
        : "rgb(51, 230, 255)";

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(phase * 0.7);
    ctx.shadowColor = color;
    ctx.shadowBlur = (24 + magnitude * 48) * style.glow;

    if (form.type === "orb") {
      const lens = ctx.createRadialGradient(
        -radius * 0.18,
        -radius * 0.2,
        radius * 0.03,
        0,
        0,
        radius
      );
      lens.addColorStop(0, color);
      lens.addColorStop(0.16, prismaticColor(form.hue + 0.18, time, 0.1));
      lens.addColorStop(0.5, prismaticColor(form.hue + 0.46, time, 0.035));
      lens.addColorStop(0.82, prismaticColor(form.hue + 0.72, time, 0.075));
      lens.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.13 + magnitude * 0.14;
      ctx.fillStyle = lens;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.12 + magnitude * 0.25;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 + magnitude * 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.82, -0.9, Math.PI * 0.7);
      ctx.stroke();
    } else if (form.type === "ring") {
      const ringGradient = prismaticGradient(
        ctx,
        -radius,
        0,
        radius,
        0,
        time + index * 310,
        0.55
      );
      ctx.globalAlpha = 0.13 + magnitude * 0.28;
      ctx.strokeStyle = ringGradient;
      ctx.lineWidth = radius * (0.06 + magnitude * 0.04);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.42, phase, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha *= 0.55;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 0.72, radius * 0.3, -phase, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const slab = ctx.createLinearGradient(-radius, 0, radius, 0);
      slab.addColorStop(0, "transparent");
      slab.addColorStop(0.22, prismaticColor(form.hue, time, 0.035));
      slab.addColorStop(0.52, prismaticColor(form.hue + 0.34, time, 0.12));
      slab.addColorStop(0.8, prismaticColor(form.hue + 0.68, time, 0.035));
      slab.addColorStop(1, "transparent");
      ctx.globalAlpha = 0.2 + magnitude * 0.2;
      ctx.fillStyle = slab;
      ctx.transform(1, 0.24, -0.28, 1, 0, 0);
      ctx.fillRect(-radius, -radius * 0.2, radius * 2, radius * 0.4);
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-radius, -radius * 0.2, radius * 2, radius * 0.4);
    }

    ctx.restore();
  }

  ctx.restore();
}

function drawBassStutterLayer(width, height, deltaTime, time) {
  if (!visualControls.bassStutter || reducedMotion) {
    bassStutterLevel = 0;
    return;
  }

  bassStutterLevel = Math.max(0, bassStutterLevel - 0.026 * deltaTime);
  if (bassStutterLevel <= 0.01) return;

  bassStutterPhase += deltaTime * (0.75 + bassStutterLevel * 2.8);
  const gate = Math.pow(Math.max(0, Math.sin(bassStutterPhase * Math.PI)), 5);
  const strength = bassStutterLevel * (0.28 + gate * 0.72);
  const pixelRatio = canvas.width / Math.max(width, 1);
  const slices = 7;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Repeated horizontal copies of the current frame create a gated visual
  // stutter while leaving the audio signal itself completely unchanged.
  for (let index = 0; index < slices; index += 1) {
    const sliceHeight = height / slices;
    const sliceY = index * sliceHeight;
    const direction = index % 2 === 0 ? 1 : -1;
    const shift =
      direction *
      (3 + index * 1.7) *
      strength *
      Math.sin(bassStutterPhase * 2.1 + index);

    ctx.globalAlpha = 0.055 + strength * 0.11;
    ctx.drawImage(
      canvas,
      0,
      sliceY * pixelRatio,
      canvas.width,
      sliceHeight * pixelRatio,
      shift,
      sliceY,
      width,
      sliceHeight
    );

    const sliceColor = isPrismatic()
      ? prismaticColor(index / slices, time, 0.22 + strength * 0.24, index * 18)
      : index % 2
        ? `rgba(255, 66, 151, ${0.08 + strength * 0.16})`
        : `rgba(${getThemeColor("--accent-rgb")}, ${0.08 + strength * 0.16})`;
    ctx.globalAlpha = 1;
    ctx.fillStyle = sliceColor;
    ctx.fillRect(0, sliceY + sliceHeight * gate, width, 1 + strength * 2);
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const shortSide = Math.min(width, height);
  ctx.translate(centerX, centerY);
  ctx.lineWidth = 0.8 + strength * 2.2;
  ctx.shadowBlur = 14 + strength * 34;

  for (let pulse = 0; pulse < 4; pulse += 1) {
    const pulseProgress = (bassStutterPhase * 0.16 + pulse / 4) % 1;
    const radius = shortSide * (0.08 + pulseProgress * 0.54);
    const color = isPrismatic()
      ? prismaticColor(pulseProgress, time, (1 - pulseProgress) * strength * 0.55)
      : `rgba(${getThemeColor("--accent-rgb")}, ${
          (1 - pulseProgress) * strength * 0.42
        })`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTripVisualsLayer(width, height, energy, time) {
  if (!visualControls.tripVisuals || reducedMotion) return;

  const style = getVisualStyle();
  const centerX = width / 2;
  const centerY = height / 2;
  const shortSide = Math.min(width, height);
  const bass = frequencyData?.[5] / 255 || 0;
  const mid = frequencyData?.[42] / 255 || 0;
  const treble = frequencyData?.[104] / 255 || 0;
  const segments = width < 520 || style.barMode === "minimal" ? 6 : 10;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = "lighter";

  // Receding rings create a slow tunnel while alternating rotation prevents
  // the layer from reading as a flat set of concentric circles.
  for (let ring = 0; ring < 7; ring += 1) {
    const progress = (ring / 7 + time * 0.000035) % 1;
    const radius = shortSide * (0.05 + progress * 0.62);
    const alpha = (1 - progress) * (0.055 + energy * 0.09);
    const ringColor = isPrismatic()
      ? prismaticColor(progress, time, alpha, ring * 29)
      : ring % 2
        ? `rgba(255, 66, 151, ${alpha})`
        : `rgba(${getThemeColor("--accent-rgb")}, ${alpha})`;

    ctx.save();
    ctx.rotate(time * 0.000025 * (ring % 2 ? 1 : -1) + ring * 0.18);
    ctx.scale(1, 0.5 + Math.sin(time * 0.0003 + ring) * 0.08);
    ctx.strokeStyle = ringColor;
    ctx.shadowColor = ringColor;
    ctx.shadowBlur = (8 + bass * 18) * style.glow;
    ctx.lineWidth = 0.6 + (1 - progress) * 1.2;
    ctx.beginPath();
    const sides = 6 + (ring % 3) * 2;
    for (let vertex = 0; vertex <= sides; vertex += 1) {
      const angle = (vertex / sides) * Math.PI * 2;
      const ripple = 1 + Math.sin(angle * 3 + time * 0.0008) * mid * 0.08;
      const x = Math.cos(angle) * radius * ripple;
      const y = Math.sin(angle) * radius * ripple;
      if (vertex === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Mirrored petals form a kaleidoscope whose length and curvature are
  // controlled by separate frequency bands.
  ctx.rotate(time * 0.000055);
  for (let segment = 0; segment < segments; segment += 1) {
    const angle = (segment / segments) * Math.PI * 2;
    const colorPosition = segment / segments;
    const color = isPrismatic()
      ? prismaticColor(colorPosition, time, 0.14 + energy * 0.2, segment * 17)
      : segment % 2
        ? `rgba(51, 230, 255, ${0.08 + energy * 0.14})`
        : `rgba(255, 66, 151, ${0.08 + energy * 0.14})`;

    ctx.save();
    ctx.rotate(angle);
    if (segment % 2) ctx.scale(1, -1);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = (5 + treble * 14) * style.glow;
    ctx.lineWidth = 0.55 + treble * 0.8;

    const inner = shortSide * (0.07 + bass * 0.025);
    const outer = shortSide * (0.28 + mid * 0.09);
    const curl = shortSide * (0.05 + treble * 0.08);
    ctx.beginPath();
    ctx.moveTo(inner, 0);
    ctx.bezierCurveTo(
      outer * 0.42,
      curl,
      outer * 0.72,
      -curl,
      outer,
      Math.sin(time * 0.0007 + segment) * curl * 0.35
    );
    ctx.bezierCurveTo(
      outer * 0.68,
      curl * 0.7,
      outer * 0.35,
      -curl * 0.45,
      inner,
      0
    );
    ctx.closePath();
    ctx.globalAlpha = 0.16 + energy * 0.18;
    ctx.fill();
    ctx.globalAlpha = 0.52 + energy * 0.24;
    ctx.stroke();
    ctx.restore();
  }

  // Three long chromatic ribbons introduce slow spatial warping through the
  // center without obscuring the primary spectrum renderer.
  ctx.rotate(-time * 0.00009);
  for (let ribbon = 0; ribbon < 3; ribbon += 1) {
    const phase = time * (0.00045 + ribbon * 0.00008) + ribbon * 2.2;
    const color = isPrismatic()
      ? prismaticColor(ribbon / 3 + 0.12, time, 0.2 + treble * 0.16)
      : ribbon === 0
        ? `rgba(${getThemeColor("--accent-rgb")}, ${0.12 + treble * 0.12})`
        : ribbon === 1
          ? `rgba(255, 66, 151, ${0.1 + treble * 0.12})`
          : `rgba(51, 230, 255, ${0.1 + treble * 0.12})`;

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 + energy * 20;
    ctx.lineWidth = 0.8 + mid * 1.4;
    ctx.beginPath();
    for (let point = 0; point <= 48; point += 1) {
      const ratio = point / 48;
      const x = (ratio - 0.5) * width * 0.92;
      const y =
        Math.sin(ratio * Math.PI * (3 + ribbon) + phase) *
        shortSide *
        (0.08 + mid * 0.06);
      if (point === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function rotatePoint3d(point, rotationX, rotationY, rotationZ) {
  const cosX = Math.cos(rotationX);
  const sinX = Math.sin(rotationX);
  const cosY = Math.cos(rotationY);
  const sinY = Math.sin(rotationY);
  const cosZ = Math.cos(rotationZ);
  const sinZ = Math.sin(rotationZ);

  const y1 = point.y * cosX - point.z * sinX;
  const z1 = point.y * sinX + point.z * cosX;
  const x2 = point.x * cosY + z1 * sinY;
  const z2 = -point.x * sinY + z1 * cosY;
  return {
    x: x2 * cosZ - y1 * sinZ,
    y: x2 * sinZ + y1 * cosZ,
    z: z2,
  };
}

function projectPoint3d(point, centerX, centerY, focalLength) {
  const depth = Math.max(0.35, point.z + 3.2);
  const scale = focalLength / depth;
  return {
    x: centerX + point.x * scale,
    y: centerY + point.y * scale,
    scale,
    depth,
  };
}

function drawDepth3dLayer(width, height, energy, time) {
  if (!visualControls.depth3d || reducedMotion) return;

  const style = getVisualStyle();
  const centerX = width / 2;
  const horizon = height * 0.43;
  const focalLength = Math.min(width, height) * 0.72;
  const bass = frequencyData?.[5] / 255 || 0;
  const mid = frequencyData?.[38] / 255 || 0;
  const treble = frequencyData?.[105] / 255 || 0;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // A moving perspective floor establishes the camera and vanishing point.
  const floorTop = horizon;
  const floorBottom = height * 0.96;
  for (let column = -7; column <= 7; column += 1) {
    const ratio = column / 7;
    const color = isPrismatic()
      ? prismaticColor((ratio + 1) / 2, time, 0.08 + energy * 0.08)
      : `rgba(${getThemeColor("--accent-rgb")}, ${0.045 + energy * 0.065})`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(centerX + ratio * width * 0.055, floorTop);
    ctx.lineTo(centerX + ratio * width * 0.72, floorBottom);
    ctx.stroke();
  }

  const gridOffset = (time * 0.00009 * (0.7 + bass)) % 1;
  for (let line = 0; line < 11; line += 1) {
    const progress = (line / 11 + gridOffset) % 1;
    const perspective = progress * progress;
    const y = floorTop + perspective * (floorBottom - floorTop);
    const halfWidth = width * (0.05 + perspective * 0.67);
    ctx.strokeStyle = isPrismatic()
      ? prismaticColor(progress, time, 0.045 + progress * 0.11)
      : `rgba(${getThemeColor("--accent-rgb")}, ${0.035 + progress * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(centerX - halfWidth, y);
    ctx.lineTo(centerX + halfWidth, y);
    ctx.stroke();
  }

  const cubeVertices = [
    { x: -1, y: -1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: -1, y: 1, z: 1 },
  ];
  const cubeEdges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const objects = width < 580 ? 2 : 4;

  for (let object = 0; object < objects; object += 1) {
    const cycle = (time * (0.000045 + object * 0.000006) + object * 0.24) % 1;
    const zPosition = 5.8 - cycle * 6.5 - bass * 0.42;
    const xPosition =
      (object - (objects - 1) / 2) * 1.45 +
      Math.sin(time * 0.00028 + object * 2.1) * 0.32;
    const yPosition = Math.cos(time * 0.00022 + object) * 0.36;
    const size = 0.34 + object * 0.055 + energy * 0.08;
    const rotationX = time * (0.00016 + mid * 0.00018) + object;
    const rotationY = time * (0.0002 + bass * 0.00015) - object * 0.7;
    const rotationZ = time * 0.00008 * (object % 2 ? -1 : 1);
    const projected = cubeVertices.map((vertex) => {
      const rotated = rotatePoint3d(
        {
          x: vertex.x * size,
          y: vertex.y * size,
          z: vertex.z * size,
        },
        rotationX,
        rotationY,
        rotationZ
      );
      return projectPoint3d(
        {
          x: rotated.x + xPosition,
          y: rotated.y + yPosition,
          z: rotated.z + zPosition,
        },
        centerX,
        horizon,
        focalLength
      );
    });

    const depthAlpha = Math.max(0.06, Math.min(0.58, (6.2 - zPosition) * 0.1));
    const color = isPrismatic()
      ? prismaticColor(object / objects, time, depthAlpha, object * 43)
      : object % 2
        ? `rgba(51, 230, 255, ${depthAlpha})`
        : `rgba(${getThemeColor("--accent-rgb")}, ${depthAlpha})`;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = (5 + treble * 18) * style.glow;
    ctx.lineWidth = 0.55 + treble * 0.9;

    for (const [start, end] of cubeEdges) {
      ctx.beginPath();
      ctx.moveTo(projected[start].x, projected[start].y);
      ctx.lineTo(projected[end].x, projected[end].y);
      ctx.stroke();
    }

    for (const point of projected) {
      const radius = Math.max(0.5, point.scale * 0.008);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function traceFractalBranch(length, depth, angle, time, colorPosition) {
  if (depth <= 0 || length < 2) return;

  const bandIndex = Math.min(
    frequencyData.length - 1,
    3 + depth * 17
  );
  const magnitude = frequencyData[bandIndex] / 255;
  const sway = Math.sin(time * 0.0007 + depth * 1.3) * 0.08;
  const branchAngle = angle + sway + magnitude * 0.07;
  const endX = Math.sin(branchAngle) * length;
  const endY = -Math.cos(branchAngle) * length;
  const color = isPrismatic()
    ? prismaticColor(colorPosition + depth * 0.08, time, 0.16 + depth * 0.075)
    : `rgba(${getThemeColor("--accent-rgb")}, ${0.08 + depth * 0.065})`;

  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 3 + magnitude * 7;
  ctx.lineWidth = Math.max(0.45, depth * 0.23);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.save();
  ctx.translate(endX, endY);
  const spread = 0.42 + magnitude * 0.18;
  traceFractalBranch(length * 0.69, depth - 1, branchAngle - spread, time, colorPosition);
  traceFractalBranch(length * 0.69, depth - 1, branchAngle + spread, time, colorPosition + 0.12);
  ctx.restore();
}

function drawFractalLayer(width, height, energy, time) {
  if (!visualControls.fractals || reducedMotion) return;

  const style = getVisualStyle();
  if (style.overlayDensity < 0.1) return;

  const depth = width < 520 || style.barMode === "minimal" ? 4 : 5;
  const length = Math.min(width, height) * (0.095 + energy * 0.035);
  const anchors = [
    { x: width * 0.08, y: height * 0.88, angle: 0.34, color: 0.08 },
    { x: width * 0.92, y: height * 0.88, angle: -0.34, color: 0.62 },
  ];

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const anchor of anchors) {
    ctx.save();
    ctx.translate(anchor.x, anchor.y);
    ctx.globalAlpha = (0.45 + energy * 0.4) * style.overlayDensity;
    traceFractalBranch(length, depth, anchor.angle, time, anchor.color);
    ctx.restore();
  }
  ctx.restore();
}

function getVisualStyle() {
  return visualStyleProfiles[visualControls.style] || visualStyleProfiles.cyber;
}

function applyVisualStyle() {
  canvasWrap.dataset.style = visualControls.style;
  styleOptions.forEach((button) => {
    button.classList.toggle("active", button.dataset.style === visualControls.style);
  });
}

function setVisualizationMode(mode) {
  const validModes = ["frequency", "waveform", "orbit", "field"];
  visualizationMode = validModes.includes(mode) ? mode : "frequency";
  canvasWrap.dataset.mode = visualizationMode;
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === visualizationMode);
  });

  const labels = {
    frequency: ["Frequency spectrum", "SPECTRUM / LIVE"],
    waveform: ["Signal waveform", "TIME DOMAIN / LIVE"],
    orbit: ["Signal orbit", "RADIAL MAP / LIVE"],
    field: ["Spectral field", "HISTORY FIELD / LIVE"],
  };
  [visualizerTitle.textContent, visualModeLabel.textContent] = labels[visualizationMode];
}

function applyDirectorScene(index, time = performance.now()) {
  directorSceneIndex = (index + directorScenes.length) % directorScenes.length;
  const scene = directorScenes[directorSceneIndex];
  visualControls = { ...visualControls, ...scene.controls };
  visualControls.accent = moodPalettes[visualControls.mood]?.accent || visualControls.accent;
  setVisualizationMode(scene.mode);
  updateControlInterface();
  saveVisualControls();
  lastDirectorChange = time;
  directorStatus.textContent = scene.name;
}

function advanceDirector(time = performance.now()) {
  if (!directorActive) return;
  applyDirectorScene(directorSceneIndex + 1, time);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createPresetPayload() {
  return {
    app: "AudioPulse Lab",
    version: 1,
    exportedAt: new Date().toISOString(),
    visualizationMode,
    controls: { ...visualControls },
  };
}

function applyImportedPreset(payload) {
  if (
    !payload ||
    payload.app !== "AudioPulse Lab" ||
    payload.version !== 1 ||
    typeof payload.controls !== "object"
  ) {
    throw new Error("Unsupported AudioPulse preset");
  }

  const imported = payload.controls;
  const nextControls = { ...controlDefaults };
  for (const key of Object.keys(controlDefaults)) {
    const sameType = typeof imported[key] === typeof controlDefaults[key];
    const validNumber = typeof imported[key] !== "number" || Number.isFinite(imported[key]);
    if (sameType && validNumber) {
      nextControls[key] = imported[key];
    }
  }

  if (!moodPalettes[nextControls.mood] && nextControls.mood !== "custom") {
    nextControls.mood = controlDefaults.mood;
  }
  if (!visualStyleProfiles[nextControls.style]) {
    nextControls.style = controlDefaults.style;
  }
  if (!/^#[0-9a-f]{6}$/i.test(nextControls.accent)) {
    nextControls.accent = controlDefaults.accent;
  }
  nextControls.sensitivity = Math.max(0.5, Math.min(2, nextControls.sensitivity));
  nextControls.smoothing = Math.max(0, Math.min(0.95, nextControls.smoothing));
  nextControls.intensity = Math.max(0.3, Math.min(1.8, nextControls.intensity));
  nextControls.motion = Math.max(0, Math.min(2, nextControls.motion));

  visualControls = nextControls;
  setVisualizationMode(payload.visualizationMode);
  updateControlInterface();
  saveVisualControls();
}

function startVisualRecording() {
  if (!window.MediaRecorder || !canvas.captureStream) {
    recordStatus.textContent = "RECORDING UNSUPPORTED";
    return;
  }

  const stream = canvas.captureStream(60);
  const mimeTypes = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
  mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  recordedChunks = [];

  mediaRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) recordedChunks.push(event.data);
  });
  mediaRecorder.addEventListener("stop", () => {
    const blob = new Blob(recordedChunks, {
      type: mediaRecorder.mimeType || "video/webm",
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadBlob(blob, `audiopulse-visual-${stamp}.webm`);
    stream.getTracks().forEach((track) => track.stop());
    recordButton.classList.remove("active");
    recordButton.textContent = "RECORD";
    recordStatus.textContent = "SAVED WEBM VIDEO";
    mediaRecorder = null;
  });

  mediaRecorder.start(250);
  recordButton.classList.add("active");
  recordButton.textContent = "STOP";
  recordStatus.textContent = "RECORDING VISUALS";
}

function getSignalEnergy() {
  if (!frequencyData?.length) return 0;

  let total = 0;
  const sampleCount = Math.min(frequencyData.length, 180);
  for (let index = 0; index < sampleCount; index += 1) {
    total += frequencyData[index];
  }

  const targetEnergy = total / sampleCount / 255;
  smoothedEnergy += (targetEnergy - smoothedEnergy) * 0.12;
  return smoothedEnergy;
}

function applySignalSensitivity() {
  const sensitivity = visualControls.sensitivity;
  for (let index = 0; index < frequencyData.length; index += 1) {
    frequencyData[index] = Math.min(255, frequencyData[index] * sensitivity);
  }

  for (let index = 0; index < waveformData.length; index += 1) {
    const centeredSample = waveformData[index] - 128;
    waveformData[index] = Math.max(
      0,
      Math.min(255, 128 + centeredSample * sensitivity)
    );
  }
}

function drawVisualizerBackdrop(width, height, energy, time) {
  const accentRgb = getThemeColor("--accent-rgb");
  const intensity = visualControls.intensity;
  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.52,
    0,
    width * 0.5,
    height * 0.52,
    Math.max(width, height) * 0.58
  );

  glow.addColorStop(0, `rgba(${accentRgb}, ${(0.025 + energy * 0.14) * intensity})`);
  glow.addColorStop(0.5, `rgba(${accentRgb}, ${energy * 0.035 * intensity})`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  if (isPrismatic()) {
    const rainbowWash = prismaticGradient(
      ctx,
      0,
      height * 0.2,
      width,
      height * 0.8,
      time,
      0.045 * intensity * energy
    );
    ctx.fillStyle = rainbowWash;
    ctx.fillRect(0, 0, width, height);
  }

  // Two restrained color blooms add chromatic depth while preserving the
  // dashboard's primary green signal language.
  const bass = frequencyData?.[3] / 255 || 0;
  const treble = frequencyData?.[90] / 255 || 0;
  const bloomRadius = Math.max(width, height) * 0.42;
  const bloomX = width * (0.22 + Math.sin(time * 0.00018) * 0.04);
  const bloomY = height * (0.58 + Math.cos(time * 0.00014) * 0.08);
  const bassBloom = ctx.createRadialGradient(
    bloomX,
    bloomY,
    0,
    bloomX,
    bloomY,
    bloomRadius
  );
  bassBloom.addColorStop(0, `rgba(0, 210, 255, ${bass * 0.075 * intensity})`);
  bassBloom.addColorStop(1, "transparent");
  ctx.fillStyle = bassBloom;
  ctx.fillRect(0, 0, width, height);

  const trebleX = width * (0.78 + Math.cos(time * 0.00016) * 0.04);
  const trebleY = height * (0.36 + Math.sin(time * 0.0002) * 0.08);
  const trebleBloom = ctx.createRadialGradient(
    trebleX,
    trebleY,
    0,
    trebleX,
    trebleY,
    bloomRadius * 0.82
  );
  trebleBloom.addColorStop(0, `rgba(255, 66, 151, ${treble * 0.065 * intensity})`);
  trebleBloom.addColorStop(1, "transparent");
  ctx.fillStyle = trebleBloom;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.12 + energy * 0.18;
  ctx.strokeStyle = `rgba(${accentRgb}, 0.28)`;
  ctx.lineWidth = 0.6;
  const offset = (time * 0.012) % 40;
  for (let x = -40 + offset; x < width + 40; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - height * 0.12, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSignalNetwork(width, height, energy, time) {
  if (reducedMotion || !visualControls.overlays || energy < 0.08) return;

  const accentRgb = getThemeColor("--accent-rgb");
  const style = getVisualStyle();
  const positions = signalNodes.map((node) => {
    const dataIndex = Math.min(
      frequencyData.length - 1,
      Math.floor(Math.pow(node.band / 11, 1.8) * (frequencyData.length * 0.42))
    );
    const magnitude = frequencyData[dataIndex] / 255;
    const drift = 5 + magnitude * 16;

    return {
      x: node.x * width + Math.sin(time * 0.00032 + node.phase) * drift,
      y: node.y * height + Math.cos(time * 0.00027 + node.phase) * drift * 0.6,
      magnitude,
    };
  });

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let first = 0; first < positions.length; first += 1) {
    for (let second = first + 1; second < positions.length; second += 1) {
      const nodeA = positions[first];
      const nodeB = positions[second];
      const distance = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
      const connectionRange = (105 + energy * 70) * style.overlayDensity;
      if (distance > connectionRange) continue;

      const strength =
        (1 - distance / connectionRange) *
        (0.03 + Math.min(nodeA.magnitude, nodeB.magnitude) * 0.18) *
        style.overlayDensity;
      ctx.strokeStyle = isPrismatic()
        ? prismaticColor((nodeA.x + nodeB.x) / (width * 2), time, strength)
        : `rgba(${accentRgb}, ${strength})`;
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.stroke();
    }
  }

  for (let index = 0; index < positions.length; index += 1) {
    const node = positions[index];
    const radius = 0.7 + node.magnitude * 2.4;
    const nodeColor = isPrismatic()
      ? prismaticColor(index / positions.length, time, 0.16 + node.magnitude * 0.68)
      : `rgba(${accentRgb}, ${0.16 + node.magnitude * 0.68})`;
    ctx.fillStyle = nodeColor;
    ctx.shadowColor = isPrismatic()
      ? prismaticColor(index / positions.length, time, 0.8)
      : `rgba(${accentRgb}, 0.8)`;
    ctx.shadowBlur = (5 + node.magnitude * 9) * style.glow;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function spawnParticles(width, height, energy) {
  if (
    reducedMotion ||
    !visualControls.overlays ||
    energy < 0.26 ||
    particles.length > 70
  ) return;

  const style = getVisualStyle();
  if (Math.random() > style.overlayDensity) return;
  const spawnCount = energy > 0.62 && style.overlayDensity > 0.5 ? 3 : 1;
  for (let index = 0; index < spawnCount; index += 1) {
    particles.push({
      x: width * (0.12 + Math.random() * 0.76),
      y: height * (0.42 + Math.random() * 0.38),
      vx: (Math.random() - 0.5) * (0.4 + energy),
      vy: -(0.35 + Math.random() * 1.1) * (0.6 + energy),
      life: 1,
      size: 0.7 + Math.random() * 1.8,
      hue: Math.random(),
    });
  }
}

function drawParticles(deltaTime, time) {
  const accentRgb = getThemeColor("--accent-rgb");

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.life -= 0.012 * deltaTime;

    if (particle.life <= 0) {
      particles.splice(index, 1);
      continue;
    }

    ctx.fillStyle = isPrismatic()
      ? prismaticColor(particle.hue, time, particle.life * 0.75)
      : `rgba(${accentRgb}, ${particle.life * 0.75})`;
    ctx.shadowColor = isPrismatic()
      ? prismaticColor(particle.hue, time, 0.8)
      : `rgba(${accentRgb}, 0.8)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function captureSpectrumHistory(time) {
  if (time - lastHistoryCapture < 58) return;

  const points = 64;
  const snapshot = new Float32Array(points);
  for (let index = 0; index < points; index += 1) {
    const normalizedIndex = index / (points - 1);
    const dataIndex = Math.floor(
      Math.pow(normalizedIndex, 1.9) * (frequencyData.length * 0.72)
    );
    snapshot[index] = frequencyData[Math.min(dataIndex, frequencyData.length - 1)] / 255;
  }

  spectrumHistory.unshift(snapshot);
  if (spectrumHistory.length > 34) spectrumHistory.pop();
  lastHistoryCapture = time;
}

function detectBeat(time) {
  if (
    !audioContext ||
    !frequencyData?.length ||
    (!visualControls.beatFx && !visualControls.bassStutter)
  ) return;

  const binWidth = audioContext.sampleRate / analyser.fftSize;
  const lastBeatBin = Math.min(frequencyData.length - 1, Math.ceil(180 / binWidth));
  let bassTotal = 0;

  for (let index = 1; index <= lastBeatBin; index += 1) {
    bassTotal += frequencyData[index];
  }

  const bassPulse = bassTotal / lastBeatBin / 255;
  const transient = bassPulse - previousBassPulse;
  if (bassPulse > 0.48 && transient > 0.055 && time - lastBeatTime > 190) {
    if (visualControls.beatFx) {
      shockwaves.push({ life: 1, strength: bassPulse });
      if (shockwaves.length > 5) shockwaves.shift();
      arcBursts.push({
        life: 1,
        rotation: Math.random() * Math.PI * 2,
        strength: bassPulse,
      });
      if (arcBursts.length > 6) arcBursts.shift();
    }
    if (visualControls.bassStutter) {
      bassStutterLevel = Math.min(1, 0.48 + bassPulse * 0.68);
      bassStutterPhase = 0;
    }
    lastBeatTime = time;
  }
  if (
    directorActive &&
    bassPulse > 0.66 &&
    transient > 0.085 &&
    performance.now() - lastDirectorChange > 7000
  ) {
    advanceDirector(performance.now());
  }

  previousBassPulse += (bassPulse - previousBassPulse) * 0.22;
}

function drawShockwaves(width, height, deltaTime, time) {
  if (!visualControls.beatFx || !shockwaves.length) return;

  const accentRgb = getThemeColor("--accent-rgb");
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.globalCompositeOperation = "lighter";

  for (let index = shockwaves.length - 1; index >= 0; index -= 1) {
    const wave = shockwaves[index];
    wave.life -= 0.018 * deltaTime;
    if (wave.life <= 0) {
      shockwaves.splice(index, 1);
      continue;
    }

    const progress = 1 - wave.life;
    const radius = progress * Math.min(width, height) * 0.58;
    ctx.strokeStyle = isPrismatic()
      ? prismaticColor(progress, time, wave.life * 0.34)
      : `rgba(${accentRgb}, ${wave.life * 0.34})`;
    ctx.lineWidth = 0.8 + wave.life * 2.2;
    ctx.shadowColor = `rgba(${accentRgb}, 0.8)`;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.34, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnergyArcs(width, height, energy, time, deltaTime) {
  if (!visualControls.overlays) return;
  const accentRgb = getThemeColor("--accent-rgb");
  const style = getVisualStyle();
  if (style.overlayDensity < 0.1) return;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.34;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  const bands = [
    { index: 4, radius: 0.76, speed: 0.00013, color: accentRgb },
    { index: 28, radius: 0.9, speed: -0.00009, color: "0, 210, 255" },
    { index: 92, radius: 1.04, speed: 0.00007, color: "255, 66, 151" },
  ];

  for (const band of bands) {
    const magnitude = frequencyData[band.index] / 255;
    if (magnitude < 0.08) continue;

    const radius = baseRadius * band.radius;
    const rotation = time * band.speed;
    const arcLength = Math.PI * (0.2 + magnitude * 0.56);
    const arcAlpha = (0.035 + magnitude * 0.17) * style.overlayDensity;
    ctx.strokeStyle = isPrismatic()
      ? prismaticColor(band.index / 100, time, arcAlpha)
      : `rgba(${band.color}, ${arcAlpha})`;
    ctx.lineWidth = 0.6 + magnitude * 1.2;
    ctx.shadowColor = `rgba(${band.color}, 0.65)`;
    ctx.shadowBlur = (6 + magnitude * 8) * style.glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius, rotation, rotation + arcLength);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius, rotation + Math.PI, rotation + Math.PI + arcLength * 0.72);
    ctx.stroke();
  }

  for (let index = arcBursts.length - 1; index >= 0; index -= 1) {
    const burst = arcBursts[index];
    burst.life -= 0.014 * deltaTime;
    burst.rotation += 0.008 * deltaTime;
    if (burst.life <= 0) {
      arcBursts.splice(index, 1);
      continue;
    }

    const progress = 1 - burst.life;
    const radius = baseRadius * (0.58 + progress * 0.78);
    ctx.strokeStyle = isPrismatic()
      ? prismaticColor(progress, time, burst.life * 0.34, burst.rotation * 30)
      : `rgba(${accentRgb}, ${burst.life * 0.34})`;
    ctx.lineWidth = 0.8 + burst.life * 1.7;
    ctx.shadowColor = `rgba(${accentRgb}, 0.9)`;
    ctx.shadowBlur = 14;
    for (let segment = 0; segment < 3; segment += 1) {
      const start = burst.rotation + segment * ((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.arc(0, 0, radius, start, start + Math.PI * 0.32);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Audio pipeline:
 * Local file: HTMLAudioElement -> MediaElementAudioSourceNode, then the source
 * branches to AnalyserNode for data and AudioContext.destination for playback.
 * Live capture: MediaStreamAudioSourceNode -> AnalyserNode only.
 *
 * The analyser exposes frequency and waveform snapshots for the canvas.
 * Captured tabs are not routed to the destination because the source tab
 * already plays its audio and a second output path would create echo.
 */
function initializeAudioPipeline() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  mediaElementSource = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = visualControls.smoothing;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;

  frequencyData = new Uint8Array(analyser.frequencyBinCount);
  waveformData = new Uint8Array(analyser.fftSize);
}

function saveVisualControls() {
  localStorage.setItem("audioPulseVisualControls", JSON.stringify(visualControls));
}

function updateControlInterface() {
  sensitivityControl.value = Math.round(visualControls.sensitivity * 100);
  smoothingControl.value = Math.round(visualControls.smoothing * 100);
  intensityControl.value = Math.round(visualControls.intensity * 100);
  motionControl.value = Math.round(visualControls.motion * 100);
  overlayToggle.checked = visualControls.overlays;
  beatFxToggle.checked = visualControls.beatFx;
  neonLightsToggle.checked = visualControls.neonLights;
  colorRainToggle.checked = visualControls.colorRain;
  geometryToggle.checked = visualControls.geometry;
  fractalsToggle.checked = visualControls.fractals;
  macroToggle.checked = visualControls.macro;
  bassStutterToggle.checked = visualControls.bassStutter;
  tripVisualsToggle.checked = visualControls.tripVisuals;
  depth3dToggle.checked = visualControls.depth3d;
  applyColorMood();
  applyVisualStyle();

  sensitivityValue.textContent = `${sensitivityControl.value}%`;
  smoothingValue.textContent = `${smoothingControl.value}%`;
  intensityValue.textContent = `${intensityControl.value}%`;
  motionValue.textContent = `${motionControl.value}%`;

  [
    sensitivityControl,
    smoothingControl,
    intensityControl,
    motionControl,
  ].forEach(updateRangeProgress);

  if (analyser) analyser.smoothingTimeConstant = visualControls.smoothing;
}

function loadVisualControls() {
  try {
    const savedControls = JSON.parse(
      localStorage.getItem("audioPulseVisualControls") || "null"
    );
    if (savedControls) {
      visualControls = { ...controlDefaults, ...savedControls };
    }
  } catch {
    visualControls = { ...controlDefaults };
  }
  updateControlInterface();
}

function bindRangeControl(element, output, property, divisor = 100) {
  element.addEventListener("input", () => {
    visualControls[property] = Number(element.value) / divisor;
    output.textContent = `${element.value}%`;
    if (property === "smoothing" && analyser) {
      analyser.smoothingTimeConstant = visualControls.smoothing;
    }
    updateRangeProgress(element);
    saveVisualControls();
  });
}

function updateRangeProgress(element) {
  const minimum = Number(element.min);
  const maximum = Number(element.max);
  const progress = ((Number(element.value) - minimum) / (maximum - minimum)) * 100;
  element.style.setProperty("--progress", `${progress}%`);
}

function disconnectAudioSources() {
  mediaElementSource?.disconnect();
  captureSource?.disconnect();
  captureSource = null;
}

function activateLocalSource() {
  initializeAudioPipeline();
  disconnectAudioSources();

  // Local files need two paths: one to the analyser and one to speakers.
  // Keeping playback outside the analyser also prevents captured tab audio
  // from being echoed when the app switches sources.
  mediaElementSource.connect(analyser);
  mediaElementSource.connect(audioContext.destination);
  activeSource = "file";
}

function resetLiveMetrics() {
  smoothedEnergy = 0;
  bassValue.textContent = "00";
  bassMeter.style.width = "0%";
  bassLabel.textContent = "NO SIGNAL";
  peakValue.textContent = "−∞";
  peakMeter.style.width = "0%";
  peakLight.classList.remove("active");
}

function setCaptureUi(isCapturing) {
  captureButton.classList.toggle("active", isCapturing);
  captureButtonLabel.textContent = isCapturing ? "Stop live capture" : "Share tab audio";
  captureButtonHint.textContent = isCapturing
    ? "Listening to shared browser audio"
    : "YouTube, Spotify, or system audio";
  playButton.disabled = isCapturing || !audio.src;
  seekBar.disabled = isCapturing;
}

function restoreLocalMetadata() {
  const file = audioFile.files[0];
  if (!file) return;

  const formattedDuration = formatTime(audio.duration);
  fileName.textContent = file.name;
  fileType.textContent = (file.type.split("/")[1] || "AUDIO").toUpperCase();
  fileSize.textContent = formatBytes(file.size);
  duration.textContent = formattedDuration;
  currentTime.textContent = formatTime(audio.currentTime);
  totalTime.textContent = formattedDuration;
}

function stopLiveCapture({ restoreStatus = true } = {}) {
  if (!captureStream || stoppingCapture) return;
  stoppingCapture = true;

  for (const track of captureStream.getTracks()) {
    track.stop();
  }
  captureSource?.disconnect();
  captureSource = null;
  captureStream = null;
  activeSource = audio.src ? "file" : "none";
  setCaptureUi(false);
  resetLiveMetrics();

  if (audio.src) {
    activateLocalSource();
    restoreLocalMetadata();
    systemStatus.textContent = "SIGNAL LOADED";
  } else {
    fileName.textContent = "No source selected";
    fileType.textContent = "NO SOURCE";
    fileSize.textContent = "—";
    duration.textContent = "00:00";
    currentTime.textContent = "00:00";
    totalTime.textContent = "00:00";
    if (restoreStatus) systemStatus.textContent = "SYSTEM READY";
  }

  window.setTimeout(() => {
    stoppingCapture = false;
  }, 0);
}

async function startLiveCapture() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    systemStatus.textContent = "CAPTURE UNSUPPORTED";
    captureButtonHint.textContent = "Use Chrome or Edge over HTTPS";
    return;
  }

  try {
    captureButtonHint.textContent = "Choose a tab and enable shared audio";
    systemStatus.textContent = "SELECT AUDIO SOURCE";
    if (!audio.paused) audio.pause();
    initializeAudioPipeline();
    if (audioContext.state === "suspended") await audioContext.resume();

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
      preferCurrentTab: false,
      selfBrowserSurface: "exclude",
      systemAudio: "include",
      surfaceSwitching: "include",
    });

    const [audioTrack] = stream.getAudioTracks();
    if (!audioTrack) {
      stream.getTracks().forEach((track) => track.stop());
      systemStatus.textContent = "NO SHARED AUDIO";
      captureButtonHint.textContent = "Enable Share tab audio and retry";
      return;
    }

    disconnectAudioSources();
    captureStream = stream;
    captureSource = audioContext.createMediaStreamSource(stream);
    // Shared tabs already play their own sound, so this path analyzes only.
    // Connecting it to the destination would create delayed echo.
    captureSource.connect(analyser);
    activeSource = "capture";

    fileName.textContent = audioTrack.label || "Shared browser audio";
    fileType.textContent = "LIVE CAPTURE";
    fileSize.textContent = "STREAM";
    duration.textContent = "LIVE";
    currentTime.textContent = "LIVE";
    totalTime.textContent = "LIVE";
    canvasEmpty.classList.add("hidden");
    visualizerPanel.classList.add("signal-active");
    setCaptureUi(true);
    systemStatus.textContent = "CAPTURING LIVE AUDIO";

    stream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => stopLiveCapture(), { once: true });
    });
  } catch (error) {
    if (error.name !== "NotAllowedError") {
      console.error("Unable to start tab audio capture:", error);
      systemStatus.textContent = "CAPTURE ERROR";
    } else {
      systemStatus.textContent = "CAPTURE CANCELLED";
    }
  }
}

function drawFrequencyBars(width, height, energy, time) {
  const style = getVisualStyle();
  const barCount = Math.max(24, Math.min(96, Math.floor(width / 9)));
  const gap = 3;
  const barWidth = (width - gap * (barCount - 1)) / barCount;
  const baseline = height * 0.72;
  const usableHeight = height * 0.6;
  const gradient = ctx.createLinearGradient(0, baseline, 0, baseline - usableHeight);
  const reflection = ctx.createLinearGradient(
    0,
    baseline,
    0,
    baseline + usableHeight * 0.22
  );

  gradient.addColorStop(0, getThemeColor("--accent"));
  gradient.addColorStop(0.68, getThemeColor("--accent"));
  gradient.addColorStop(1, getThemeColor("--warning"));
  reflection.addColorStop(0, `rgba(${getThemeColor("--accent-rgb")}, 0.26)`);
  reflection.addColorStop(1, "transparent");

  if (peakCaps.length !== barCount) {
    peakCaps = new Array(barCount).fill(baseline);
  }

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.shadowColor = `rgba(${getThemeColor("--accent-rgb")}, 0.35)`;
  ctx.shadowBlur = (9 + energy * 15) * style.glow;

  for (let index = 0; index < barCount; index += 1) {
    // A curved index gives extra screen space to bass and mids, where most
    // musical detail lives, instead of drawing every FFT bin one-for-one.
    const normalizedIndex = index / barCount;
    const dataIndex = Math.floor(Math.pow(normalizedIndex, 2.15) * (frequencyData.length - 1));
    const magnitude = frequencyData[dataIndex] / 255;
    const barHeight = Math.max(2, magnitude * usableHeight);
    const x = index * (barWidth + gap);
    const y = baseline - barHeight;
    const bandColor = isPrismatic()
      ? prismaticColor(normalizedIndex, time, 1)
      : getThemeColor("--accent");
    const bandGlow = isPrismatic()
      ? prismaticColor(normalizedIndex, time, 0.75)
      : `rgba(${getThemeColor("--accent-rgb")}, 0.35)`;

    if (isPrismatic()) {
      ctx.fillStyle = bandColor;
      ctx.strokeStyle = bandColor;
      ctx.shadowColor = bandGlow;
    }

    if (style.barMode === "wire") {
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = bandColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, Math.max(1, barWidth), barHeight);
      ctx.globalAlpha = 1;
    } else if (style.barMode === "laser") {
      ctx.strokeStyle =
        magnitude > 0.7 && !isPrismatic() ? getThemeColor("--warning") : bandColor;
      ctx.lineWidth = Math.max(1, barWidth * 0.24);
      ctx.beginPath();
      ctx.moveTo(x + barWidth / 2, baseline);
      ctx.lineTo(x + barWidth / 2, y);
      ctx.stroke();
      ctx.fillStyle = isPrismatic()
        ? prismaticColor(normalizedIndex + 0.08, time, 1)
        : getThemeColor("--warning");
      ctx.fillRect(x + barWidth / 2 - 1, y - 1, 2, 2);
      ctx.fillStyle = gradient;
    } else if (style.barMode === "minimal") {
      ctx.globalAlpha = 0.72;
      ctx.fillRect(x, y, Math.max(1, barWidth), barHeight);
      ctx.globalAlpha = 1;
    } else if (style.barMode === "aurora") {
      const aurora = ctx.createLinearGradient(0, baseline, 0, y);
      aurora.addColorStop(0, isPrismatic() ? bandColor : getThemeColor("--accent"));
      aurora.addColorStop(0.55, prismaticColor(normalizedIndex + 0.22, time, 1));
      aurora.addColorStop(1, prismaticColor(normalizedIndex + 0.46, time, 1));
      ctx.fillStyle = aurora;
      ctx.beginPath();
      ctx.roundRect(x, y, Math.max(1, barWidth), barHeight, Math.min(4, barWidth / 2));
      ctx.fill();
      ctx.fillStyle = gradient;
    } else {
      ctx.fillRect(x, y, Math.max(1, barWidth), barHeight);
    }

    if (style.barMode !== "minimal") {
      peakCaps[index] = Math.min(peakCaps[index] + 0.7, y);
      ctx.fillStyle = isPrismatic()
        ? prismaticColor(normalizedIndex + 0.1, time, 1)
        : getThemeColor("--warning");
      ctx.fillRect(x, peakCaps[index], Math.max(1, barWidth), 1.5);
      ctx.fillStyle = gradient;
    }

    const reflectionHeight = barHeight * 0.22;
    if (style.reflection > 0) {
      ctx.globalAlpha = style.reflection;
      ctx.fillStyle = isPrismatic()
        ? prismaticColor(normalizedIndex, time, 0.22)
        : reflection;
      ctx.fillRect(x, baseline + 3, Math.max(1, barWidth), reflectionHeight);
      ctx.fillStyle = gradient;
      ctx.globalAlpha = 1;
    }
  }

  ctx.strokeStyle = `rgba(${getThemeColor("--accent-rgb")}, ${0.16 + energy * 0.3})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baseline + 1);
  ctx.lineTo(width, baseline + 1);
  ctx.stroke();
  ctx.restore();
}

function traceWaveform(width, height, amplitude, offsetY) {
  const sliceWidth = width / (waveformData.length - 1);
  ctx.beginPath();
  for (let index = 0; index < waveformData.length; index += 1) {
    const sample = (waveformData[index] - 128) / 128;
    const x = index * sliceWidth;
    const y = offsetY + sample * height * amplitude;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

function drawWaveform(width, height, energy, time) {
  const style = getVisualStyle();
  const accent = getThemeColor("--accent");
  const accentRgb = getThemeColor("--accent-rgb");
  const centerY = height * 0.5;

  ctx.save();
  traceWaveform(width, height, 0.32, centerY);
  ctx.lineTo(width, centerY);
  ctx.lineTo(0, centerY);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, centerY - height * 0.3, 0, centerY + height * 0.3);
  if (isPrismatic()) {
    fill.addColorStop(0, prismaticColor(0.05, time, 0.08 + energy * 0.16));
    fill.addColorStop(0.35, prismaticColor(0.35, time, 0.05));
    fill.addColorStop(0.7, prismaticColor(0.7, time, 0.04));
    fill.addColorStop(1, prismaticColor(0.95, time, 0.04 + energy * 0.08));
  } else {
    fill.addColorStop(0, `rgba(${accentRgb}, ${0.08 + energy * 0.16})`);
    fill.addColorStop(0.5, `rgba(${accentRgb}, 0.015)`);
    fill.addColorStop(1, `rgba(${accentRgb}, ${0.04 + energy * 0.08})`);
  }
  ctx.fillStyle = fill;
  ctx.fill();

  const traces = [
    { amplitude: 0.32, alpha: 1, width: 2.1, blur: 16 },
    { amplitude: 0.255, alpha: 0.35, width: 1, blur: 5 },
    { amplitude: 0.39, alpha: 0.16, width: 0.8, blur: 2 },
  ].slice(0, style.waveformLayers);

  for (let index = 0; index < traces.length; index += 1) {
    const trace = traces[index];
    traceWaveform(width, height, trace.amplitude, centerY);
    ctx.globalAlpha = trace.alpha;
    ctx.lineWidth = trace.width;
    ctx.strokeStyle = isPrismatic()
      ? prismaticGradient(ctx, 0, 0, width, 0, time, trace.alpha)
      : accent;
    ctx.shadowColor = isPrismatic()
      ? prismaticColor(index / traces.length, time, 0.8)
      : `rgba(${accentRgb}, 0.8)`;
    ctx.shadowBlur = (trace.blur + energy * 10) * style.glow;
    ctx.stroke();
  }

  ctx.globalAlpha = 0.35;
  ctx.setLineDash([2, 8]);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
  ctx.restore();
}

function drawOrbit(width, height, energy, time) {
  const style = getVisualStyle();
  const centerX = width / 2;
  const centerY = height / 2;
  const accent = getThemeColor("--accent");
  const accentRgb = getThemeColor("--accent-rgb");
  const warning = getThemeColor("--warning");
  const baseRadius = Math.min(width, height) * (0.23 + energy * 0.02);
  const bars = Math.min(150, Math.max(90, Math.floor(width / 5)));

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(time * 0.000035);
  ctx.globalCompositeOperation = "lighter";

  for (let index = 0; index < bars; index += 1) {
    const angle = (index / bars) * Math.PI * 2;
    const halfPosition = (index % (bars / 2)) / (bars / 2);
    const dataIndex = Math.floor(Math.pow(halfPosition, 1.7) * (frequencyData.length * 0.55));
    const magnitude = frequencyData[Math.min(dataIndex, frequencyData.length - 1)] / 255;
    const barLength = 4 + magnitude * Math.min(width, height) * 0.17;
    const innerX = Math.cos(angle) * baseRadius;
    const innerY = Math.sin(angle) * baseRadius;
    const outerX = Math.cos(angle) * (baseRadius + barLength);
    const outerY = Math.sin(angle) * (baseRadius + barLength);

    ctx.strokeStyle = isPrismatic()
      ? prismaticColor(index / bars, time, 1)
      : magnitude > 0.72 ? warning : accent;
    ctx.globalAlpha = 0.2 + magnitude * 0.8;
    ctx.lineWidth = (width < 600 ? 1 : 1.5) *
      (style.barMode === "laser" ? 0.55 : style.barMode === "minimal" ? 0.7 : 1);
    ctx.shadowColor = `rgba(${accentRgb}, 0.7)`;
    ctx.shadowBlur = (4 + magnitude * 10) * style.glow;
    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = isPrismatic()
    ? prismaticGradient(ctx, -baseRadius, 0, baseRadius, 0, time, 1)
    : accent;
  ctx.shadowColor = isPrismatic()
    ? prismaticColor(0.5, time, 0.7)
    : `rgba(${accentRgb}, 0.7)`;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3 + energy * 0.45;

  ctx.beginPath();
  const waveformPoints = 260;
  for (let index = 0; index <= waveformPoints; index += 1) {
    const angle = (index / waveformPoints) * Math.PI * 2;
    const dataIndex = Math.floor((index / waveformPoints) * (waveformData.length - 1));
    const displacement = ((waveformData[dataIndex] - 128) / 128) * baseRadius * 0.22;
    const radius = baseRadius * 0.78 + displacement;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.68);
  core.addColorStop(0, `rgba(${accentRgb}, ${0.12 + energy * 0.4})`);
  core.addColorStop(0.48, `rgba(${accentRgb}, ${0.035 + energy * 0.1})`);
  core.addColorStop(1, "transparent");
  ctx.globalAlpha = 1;
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * 0.75, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isPrismatic() ? prismaticColor(0.15, time, 1) : accent;
  ctx.shadowBlur = 20 + energy * 35;
  ctx.globalAlpha = 0.65 + energy * 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, 2 + energy * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpectrumField(width, height, energy, time) {
  const style = getVisualStyle();
  const accentRgb = getThemeColor("--accent-rgb");
  const warning = getThemeColor("--warning");
  const rows = spectrumHistory.length;
  if (!rows) return;

  const horizon = height * 0.23;
  const floor = height * 0.9;
  const centerX = width / 2;
  const fieldWidth = width * 0.9;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const horizonGlow = ctx.createLinearGradient(0, horizon - 20, 0, floor);
  horizonGlow.addColorStop(0, `rgba(${accentRgb}, ${0.02 + energy * 0.1})`);
  horizonGlow.addColorStop(0.45, "transparent");
  horizonGlow.addColorStop(1, `rgba(${accentRgb}, ${0.025 + energy * 0.04})`);
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, horizon - 20, width, floor - horizon + 20);

  for (let row = rows - 1; row >= 0; row -= 1) {
    const snapshot = spectrumHistory[row];
    const depth = 1 - row / Math.max(rows - 1, 1);
    const perspective = 0.18 + Math.pow(depth, 1.7) * 0.82;
    const yBase = horizon + Math.pow(depth, 1.9) * (floor - horizon);
    const rowWidth = fieldWidth * perspective;
    const left = centerX - rowWidth / 2;
    const amplitude = height * (0.035 + perspective * 0.18);
    const alpha = 0.08 + perspective * 0.74;

    ctx.beginPath();
    for (let point = 0; point < snapshot.length; point += 1) {
      const x = left + (point / (snapshot.length - 1)) * rowWidth;
      const edgeFade = Math.sin((point / (snapshot.length - 1)) * Math.PI);
      const y = yBase - snapshot[point] * amplitude * edgeFade;
      if (point === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = isPrismatic()
      ? prismaticColor(depth, time, alpha, row * 2)
      : depth > 0.82 && energy > 0.52
        ? warning
        : `rgba(${accentRgb}, ${alpha})`;
    ctx.lineWidth = (0.55 + perspective * 1.15) *
      (style.barMode === "laser" ? 0.65 : 1);
    ctx.shadowColor = `rgba(${accentRgb}, 0.65)`;
    ctx.shadowBlur = perspective * (4 + energy * 8) * style.glow;
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
  ctx.lineWidth = 0.5;
  for (let column = 0; column <= 12; column += 1) {
    const ratio = column / 12;
    const horizonX = centerX + (ratio - 0.5) * fieldWidth * 0.18;
    const floorX = centerX + (ratio - 0.5) * fieldWidth;
    ctx.strokeStyle = `rgba(${accentRgb}, ${0.05 + energy * 0.08})`;
    ctx.beginPath();
    ctx.moveTo(horizonX, horizon);
    ctx.lineTo(floorX, floor);
    ctx.stroke();
  }

  const sweepX = ((time * 0.045) % (width + 160)) - 80;
  const sweep = ctx.createLinearGradient(sweepX - 50, 0, sweepX + 50, 0);
  sweep.addColorStop(0, "transparent");
  sweep.addColorStop(0.5, `rgba(${accentRgb}, ${0.04 + energy * 0.1})`);
  sweep.addColorStop(1, "transparent");
  ctx.fillStyle = sweep;
  ctx.fillRect(0, horizon, width, floor - horizon);
  ctx.restore();
}

function updateMetrics() {
  // Bass energy averages FFT bins between 20 Hz and 250 Hz.
  const binWidth = audioContext.sampleRate / analyser.fftSize;
  const firstBassBin = Math.max(1, Math.floor(20 / binWidth));
  const lastBassBin = Math.min(frequencyData.length - 1, Math.ceil(250 / binWidth));
  let bassTotal = 0;

  for (let index = firstBassBin; index <= lastBassBin; index += 1) {
    bassTotal += frequencyData[index];
  }

  const bassPercent = Math.round(
    (bassTotal / (lastBassBin - firstBassBin + 1) / 255) * 100
  );

  // Peak level comes from the largest waveform displacement from silence.
  let peakAmplitude = 0;
  for (const sample of waveformData) {
    peakAmplitude = Math.max(peakAmplitude, Math.abs((sample - 128) / 128));
  }

  const decibels = peakAmplitude > 0 ? 20 * Math.log10(peakAmplitude) : -Infinity;
  const peakPercent = Number.isFinite(decibels)
    ? Math.max(0, Math.min(100, ((decibels + 48) / 48) * 100))
    : 0;

  bassValue.textContent = String(bassPercent).padStart(2, "0");
  bassMeter.style.width = `${bassPercent}%`;
  bassLabel.textContent =
    bassPercent > 70 ? "HIGH INTENSITY" : bassPercent > 35 ? "ACTIVE RANGE" : "LOW ENERGY";

  peakValue.textContent = Number.isFinite(decibels) ? Math.round(decibels) : "−∞";
  peakMeter.style.width = `${peakPercent}%`;
  peakLight.classList.toggle("active", decibels > -3);
}

function animate() {
  const now = performance.now();
  const deltaTime = Math.min((now - lastFrameTime) / 16.67, 2);
  lastFrameTime = now;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  if (analyser) {
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(waveformData);
    applySignalSensitivity();
    const energy = getSignalEnergy();
    const visualEnergy = Math.min(1, energy * visualControls.intensity);
    const visualTime = now * visualControls.motion;
    const visualDelta = deltaTime * visualControls.motion;

    if (directorActive && now - lastDirectorChange > 14000) {
      advanceDirector(now);
    }
    captureSpectrumHistory(now);
    detectBeat(visualTime);
    drawVisualizerBackdrop(width, height, visualEnergy, visualTime);
    drawLiquidMembrane(width, height, visualEnergy, visualTime);
    drawNeonLights(width, height, visualEnergy, visualTime);
    drawColorRain(width, height, visualEnergy, visualTime, visualDelta);
    drawMacroLayer(width, height, visualEnergy, visualTime);
    drawDepth3dLayer(width, height, visualEnergy, visualTime);
    drawTripVisualsLayer(width, height, visualEnergy, visualTime);
    drawGeometryLayer(width, height, visualEnergy, visualTime);
    if (visualizationMode === "frequency") {
      drawFrequencyBars(width, height, visualEnergy, visualTime);
    } else if (visualizationMode === "waveform") {
      drawWaveform(width, height, visualEnergy, visualTime);
    } else if (visualizationMode === "orbit") {
      drawOrbit(width, height, visualEnergy, visualTime);
    } else {
      drawSpectrumField(width, height, visualEnergy, visualTime);
    }

    drawBassStutterLayer(width, height, visualDelta, visualTime);
    drawFractalLayer(width, height, visualEnergy, visualTime);
    drawSignalNetwork(width, height, visualEnergy, visualTime);
    drawEnergyArcs(width, height, visualEnergy, visualTime, visualDelta);
    spawnParticles(width, height, visualEnergy);
    drawParticles(visualDelta, visualTime);
    drawShockwaves(width, height, visualDelta, visualTime);
    updateMetrics();
    canvasWrap.style.setProperty("--energy", visualEnergy.toFixed(3));
    canvasWrap.style.setProperty("--energy-haze", (visualEnergy * 0.16).toFixed(3));
    visualizerPanel.style.setProperty("--energy", visualEnergy.toFixed(3));
    visualizerPanel.style.setProperty(
      "--energy-alpha",
      (0.12 + visualEnergy * 0.38).toFixed(3)
    );
    visualizerPanel.style.setProperty(
      "--energy-shadow",
      (visualEnergy * 0.15).toFixed(3)
    );
    visualizerPanel.style.setProperty("--energy-glow", `${16 + visualEnergy * 34}px`);
  }

  fpsFrames += 1;
  if (now - fpsSampleTime >= 1000) {
    visualFps.textContent = `${Math.round((fpsFrames * 1000) / (now - fpsSampleTime))} FPS`;
    fpsFrames = 0;
    fpsSampleTime = now;
  }

  // requestAnimationFrame keeps drawing synchronized with the browser's
  // refresh cycle and pauses efficiently when the tab is not visible.
  animationId = requestAnimationFrame(animate);
}

audioFile.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;

  if (captureStream) stopLiveCapture({ restoreStatus: false });
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  audio.src = objectUrl;
  audio.load();

  fileName.textContent = file.name;
  fileType.textContent = (file.type.split("/")[1] || "AUDIO").toUpperCase();
  fileSize.textContent = formatBytes(file.size);
  playButton.disabled = false;
  canvasEmpty.classList.add("hidden");
  visualizerPanel.classList.add("signal-active");
  systemStatus.textContent = "SIGNAL LOADED";
});

playButton.addEventListener("click", async () => {
  activateLocalSource();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if (audio.paused) await audio.play();
  else audio.pause();
});

captureButton.addEventListener("click", async () => {
  if (captureStream) stopLiveCapture();
  else await startLiveCapture();
});

bindRangeControl(
  sensitivityControl,
  sensitivityValue,
  "sensitivity"
);
bindRangeControl(smoothingControl, smoothingValue, "smoothing");
bindRangeControl(intensityControl, intensityValue, "intensity");
bindRangeControl(motionControl, motionValue, "motion");

overlayToggle.addEventListener("change", () => {
  visualControls.overlays = overlayToggle.checked;
  if (!visualControls.overlays) particles.length = 0;
  saveVisualControls();
});

beatFxToggle.addEventListener("change", () => {
  visualControls.beatFx = beatFxToggle.checked;
  if (!visualControls.beatFx) {
    shockwaves.length = 0;
    arcBursts.length = 0;
  }
  saveVisualControls();
});

neonLightsToggle.addEventListener("change", () => {
  visualControls.neonLights = neonLightsToggle.checked;
  saveVisualControls();
});

colorRainToggle.addEventListener("change", () => {
  visualControls.colorRain = colorRainToggle.checked;
  saveVisualControls();
});

geometryToggle.addEventListener("change", () => {
  visualControls.geometry = geometryToggle.checked;
  saveVisualControls();
});

fractalsToggle.addEventListener("change", () => {
  visualControls.fractals = fractalsToggle.checked;
  saveVisualControls();
});

macroToggle.addEventListener("change", () => {
  visualControls.macro = macroToggle.checked;
  saveVisualControls();
});

bassStutterToggle.addEventListener("change", () => {
  visualControls.bassStutter = bassStutterToggle.checked;
  if (!visualControls.bassStutter) bassStutterLevel = 0;
  saveVisualControls();
});

tripVisualsToggle.addEventListener("change", () => {
  visualControls.tripVisuals = tripVisualsToggle.checked;
  saveVisualControls();
});

depth3dToggle.addEventListener("change", () => {
  visualControls.depth3d = depth3dToggle.checked;
  saveVisualControls();
});

directorToggle.addEventListener("click", () => {
  directorActive = !directorActive;
  directorToggle.classList.toggle("active", directorActive);
  directorToggle.textContent = directorActive ? "STOP" : "START";
  if (directorActive) {
    applyDirectorScene(directorSceneIndex + 1);
  } else {
    directorStatus.textContent = "MANUAL CONTROL";
  }
});

recordButton.addEventListener("click", () => {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
  } else {
    startVisualRecording();
  }
});

exportPreset.addEventListener("click", () => {
  const preset = JSON.stringify(createPresetPayload(), null, 2);
  const blob = new Blob([preset], { type: "application/json" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `audiopulse-preset-${stamp}.json`);
  presetStatus.textContent = "PRESET EXPORTED";
});

importPreset.addEventListener("change", async () => {
  const [file] = importPreset.files;
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    applyImportedPreset(payload);
    presetStatus.textContent = "PRESET IMPORTED";
  } catch (error) {
    console.error("Unable to import preset:", error);
    presetStatus.textContent = "INVALID PRESET FILE";
  } finally {
    importPreset.value = "";
  }
});

moodSwatches.forEach((button) => {
  button.addEventListener("click", () => {
    visualControls.mood = button.dataset.mood;
    visualControls.accent = moodPalettes[visualControls.mood].accent;
    applyColorMood();
    saveVisualControls();
  });
});

styleOptions.forEach((button) => {
  button.addEventListener("click", () => {
    visualControls.style = button.dataset.style;
    applyVisualStyle();
    saveVisualControls();
  });
});

customColor.addEventListener("input", () => {
  visualControls.mood = "custom";
  visualControls.accent = customColor.value;
  applyColorMood();
  saveVisualControls();
});

resetControls.addEventListener("click", () => {
  visualControls = { ...controlDefaults };
  updateControlInterface();
  saveVisualControls();
});

audio.addEventListener("loadedmetadata", () => {
  const formattedDuration = formatTime(audio.duration);
  duration.textContent = formattedDuration;
  totalTime.textContent = formattedDuration;
});

audio.addEventListener("play", () => {
  playButton.classList.add("playing");
  playButton.setAttribute("aria-label", "Pause audio");
  systemStatus.textContent = "ANALYZING SIGNAL";
});

audio.addEventListener("pause", () => {
  playButton.classList.remove("playing");
  playButton.setAttribute("aria-label", "Play audio");
  systemStatus.textContent = audio.ended ? "ANALYSIS COMPLETE" : "SIGNAL PAUSED";
});

audio.addEventListener("timeupdate", () => {
  if (activeSource === "capture") return;
  const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  seekBar.value = progress;
  seekBar.style.setProperty("--progress", `${progress}%`);
  currentTime.textContent = formatTime(audio.currentTime);
});

audio.addEventListener("ended", () => {
  audio.currentTime = 0;
});

seekBar.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
});

document.querySelectorAll(".mode-button").forEach((button) => {
  button.addEventListener("click", () => {
    setVisualizationMode(button.dataset.mode);
  });
});

async function toggleVisualizerFullscreen() {
  if (!document.fullscreenElement) {
    await canvasWrap.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

expandVisualizer.addEventListener("click", toggleVisualizerFullscreen);
exitFullscreen.addEventListener("click", toggleVisualizerFullscreen);

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = document.fullscreenElement === canvasWrap;
  expandVisualizer.setAttribute(
    "aria-label",
    isFullscreen ? "Exit fullscreen visualizer" : "Enter fullscreen visualizer"
  );
  window.setTimeout(resizeCanvas, 80);
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(animationId);
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  captureStream?.getTracks().forEach((track) => track.stop());
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

resizeCanvas();
loadVisualControls();
animate();
