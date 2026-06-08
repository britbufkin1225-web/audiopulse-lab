const audio = document.querySelector("#audio");
const audioFile = document.querySelector("#audioFile");
const playButton = document.querySelector("#playButton");
const seekBar = document.querySelector("#seekBar");
const canvas = document.querySelector("#visualizer");
const canvasEmpty = document.querySelector("#canvasEmpty");
const ctx = canvas.getContext("2d");
const visualizerPanel = document.querySelector(".visualizer-panel");
const canvasWrap = document.querySelector(".canvas-wrap");
const visualFps = document.querySelector("#visualFps");

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
let sourceNode;
let analyser;
let frequencyData;
let waveformData;
let animationId;
let objectUrl;
let visualizationMode = "frequency";
let smoothedEnergy = 0;
let lastFrameTime = performance.now();
let fpsSampleTime = performance.now();
let fpsFrames = 0;
let peakCaps = [];
const particles = [];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function drawVisualizerBackdrop(width, height, energy, time) {
  const accentRgb = getThemeColor("--accent-rgb");
  const glow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.52,
    0,
    width * 0.5,
    height * 0.52,
    Math.max(width, height) * 0.58
  );

  glow.addColorStop(0, `rgba(${accentRgb}, ${0.025 + energy * 0.14})`);
  glow.addColorStop(0.5, `rgba(${accentRgb}, ${energy * 0.035})`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
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

function spawnParticles(width, height, energy) {
  if (reducedMotion || energy < 0.26 || particles.length > 70) return;

  const spawnCount = energy > 0.62 ? 3 : 1;
  for (let index = 0; index < spawnCount; index += 1) {
    particles.push({
      x: width * (0.12 + Math.random() * 0.76),
      y: height * (0.42 + Math.random() * 0.38),
      vx: (Math.random() - 0.5) * (0.4 + energy),
      vy: -(0.35 + Math.random() * 1.1) * (0.6 + energy),
      life: 1,
      size: 0.7 + Math.random() * 1.8,
    });
  }
}

function drawParticles(deltaTime) {
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

    ctx.fillStyle = `rgba(${accentRgb}, ${particle.life * 0.75})`;
    ctx.shadowColor = `rgba(${accentRgb}, 0.8)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Audio pipeline:
 * HTMLAudioElement -> MediaElementAudioSourceNode -> AnalyserNode -> speakers.
 *
 * The source node sends the selected track into the Web Audio graph. The
 * AnalyserNode observes that signal without changing it, exposing frequency
 * and waveform snapshots for the canvas. Connecting the analyser to the
 * destination lets the same signal continue to the user's speakers.
 */
function initializeAudioPipeline() {
  if (audioContext) return;

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.82;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;

  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  frequencyData = new Uint8Array(analyser.frequencyBinCount);
  waveformData = new Uint8Array(analyser.fftSize);
}

function drawFrequencyBars(width, height, energy) {
  const barCount = Math.max(24, Math.min(96, Math.floor(width / 9)));
  const gap = 3;
  const barWidth = (width - gap * (barCount - 1)) / barCount;
  const baseline = height * 0.72;
  const usableHeight = height * 0.6;
  const gradient = ctx.createLinearGradient(0, baseline, 0, baseline - usableHeight);

  gradient.addColorStop(0, getThemeColor("--accent"));
  gradient.addColorStop(0.68, getThemeColor("--accent"));
  gradient.addColorStop(1, getThemeColor("--warning"));

  if (peakCaps.length !== barCount) {
    peakCaps = new Array(barCount).fill(baseline);
  }

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.shadowColor = `rgba(${getThemeColor("--accent-rgb")}, 0.35)`;
  ctx.shadowBlur = 9 + energy * 15;

  for (let index = 0; index < barCount; index += 1) {
    // A curved index gives extra screen space to bass and mids, where most
    // musical detail lives, instead of drawing every FFT bin one-for-one.
    const normalizedIndex = index / barCount;
    const dataIndex = Math.floor(Math.pow(normalizedIndex, 2.15) * (frequencyData.length - 1));
    const magnitude = frequencyData[dataIndex] / 255;
    const barHeight = Math.max(2, magnitude * usableHeight);
    const x = index * (barWidth + gap);
    const y = baseline - barHeight;

    ctx.fillRect(x, y, Math.max(1, barWidth), barHeight);

    peakCaps[index] = Math.min(peakCaps[index] + 0.7, y);
    ctx.fillStyle = getThemeColor("--warning");
    ctx.fillRect(x, peakCaps[index], Math.max(1, barWidth), 1.5);
    ctx.fillStyle = gradient;

    const reflectionHeight = barHeight * 0.22;
    const reflection = ctx.createLinearGradient(0, baseline, 0, baseline + reflectionHeight);
    reflection.addColorStop(0, `rgba(${getThemeColor("--accent-rgb")}, 0.26)`);
    reflection.addColorStop(1, "transparent");
    ctx.fillStyle = reflection;
    ctx.fillRect(x, baseline + 3, Math.max(1, barWidth), reflectionHeight);
    ctx.fillStyle = gradient;
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

function drawWaveform(width, height, energy) {
  const accent = getThemeColor("--accent");
  const accentRgb = getThemeColor("--accent-rgb");
  const centerY = height * 0.5;

  ctx.save();
  traceWaveform(width, height, 0.32, centerY);
  ctx.lineTo(width, centerY);
  ctx.lineTo(0, centerY);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, centerY - height * 0.3, 0, centerY + height * 0.3);
  fill.addColorStop(0, `rgba(${accentRgb}, ${0.08 + energy * 0.16})`);
  fill.addColorStop(0.5, `rgba(${accentRgb}, 0.015)`);
  fill.addColorStop(1, `rgba(${accentRgb}, ${0.04 + energy * 0.08})`);
  ctx.fillStyle = fill;
  ctx.fill();

  const traces = [
    { amplitude: 0.32, alpha: 1, width: 2.1, blur: 16 },
    { amplitude: 0.255, alpha: 0.35, width: 1, blur: 5 },
    { amplitude: 0.39, alpha: 0.16, width: 0.8, blur: 2 },
  ];

  for (const trace of traces) {
    traceWaveform(width, height, trace.amplitude, centerY);
    ctx.globalAlpha = trace.alpha;
    ctx.lineWidth = trace.width;
    ctx.strokeStyle = accent;
    ctx.shadowColor = `rgba(${accentRgb}, 0.8)`;
    ctx.shadowBlur = trace.blur + energy * 10;
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

    ctx.strokeStyle = magnitude > 0.72 ? warning : accent;
    ctx.globalAlpha = 0.2 + magnitude * 0.8;
    ctx.lineWidth = width < 600 ? 1 : 1.5;
    ctx.shadowColor = `rgba(${accentRgb}, 0.7)`;
    ctx.shadowBlur = 4 + magnitude * 10;
    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = accent;
  ctx.shadowColor = `rgba(${accentRgb}, 0.7)`;
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

  ctx.fillStyle = accent;
  ctx.shadowBlur = 20 + energy * 35;
  ctx.globalAlpha = 0.65 + energy * 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, 2 + energy * 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function updateMetrics() {
  analyser.getByteFrequencyData(frequencyData);
  analyser.getByteTimeDomainData(waveformData);

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
    const energy = getSignalEnergy();

    drawVisualizerBackdrop(width, height, energy, now);
    if (visualizationMode === "frequency") drawFrequencyBars(width, height, energy);
    else if (visualizationMode === "waveform") drawWaveform(width, height, energy);
    else drawOrbit(width, height, energy, now);

    spawnParticles(width, height, energy);
    drawParticles(deltaTime);
    updateMetrics();
    canvasWrap.style.setProperty("--energy", energy.toFixed(3));
    canvasWrap.style.setProperty("--energy-haze", (energy * 0.16).toFixed(3));
    visualizerPanel.style.setProperty("--energy", energy.toFixed(3));
    visualizerPanel.style.setProperty("--energy-alpha", (0.12 + energy * 0.38).toFixed(3));
    visualizerPanel.style.setProperty("--energy-shadow", (energy * 0.15).toFixed(3));
    visualizerPanel.style.setProperty("--energy-glow", `${16 + energy * 34}px`);
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
  initializeAudioPipeline();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if (audio.paused) await audio.play();
  else audio.pause();
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
    visualizationMode = button.dataset.mode;
    canvasWrap.dataset.mode = visualizationMode;
    document.querySelectorAll(".mode-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    visualizerTitle.textContent =
      visualizationMode === "frequency"
        ? "Frequency spectrum"
        : visualizationMode === "waveform"
          ? "Signal waveform"
          : "Signal orbit";
  });
});

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(animationId);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

resizeCanvas();
animate();
