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
const particles = [];
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
  bassBloom.addColorStop(0, `rgba(0, 210, 255, ${bass * 0.075})`);
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
  trebleBloom.addColorStop(0, `rgba(255, 66, 151, ${treble * 0.065})`);
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
  if (reducedMotion || energy < 0.08) return;

  const accentRgb = getThemeColor("--accent-rgb");
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
      const connectionRange = 105 + energy * 70;
      if (distance > connectionRange) continue;

      const strength =
        (1 - distance / connectionRange) *
        (0.03 + Math.min(nodeA.magnitude, nodeB.magnitude) * 0.18);
      ctx.strokeStyle = `rgba(${accentRgb}, ${strength})`;
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.stroke();
    }
  }

  for (const node of positions) {
    const radius = 0.7 + node.magnitude * 2.4;
    ctx.fillStyle = `rgba(${accentRgb}, ${0.16 + node.magnitude * 0.68})`;
    ctx.shadowColor = `rgba(${accentRgb}, 0.8)`;
    ctx.shadowBlur = 5 + node.magnitude * 9;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();
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
  if (!audioContext || !frequencyData?.length) return;

  const binWidth = audioContext.sampleRate / analyser.fftSize;
  const lastBeatBin = Math.min(frequencyData.length - 1, Math.ceil(180 / binWidth));
  let bassTotal = 0;

  for (let index = 1; index <= lastBeatBin; index += 1) {
    bassTotal += frequencyData[index];
  }

  const bassPulse = bassTotal / lastBeatBin / 255;
  const transient = bassPulse - previousBassPulse;
  if (bassPulse > 0.48 && transient > 0.055 && time - lastBeatTime > 190) {
    shockwaves.push({ life: 1, strength: bassPulse });
    if (shockwaves.length > 5) shockwaves.shift();
    arcBursts.push({
      life: 1,
      rotation: Math.random() * Math.PI * 2,
      strength: bassPulse,
    });
    if (arcBursts.length > 6) arcBursts.shift();
    lastBeatTime = time;
  }

  previousBassPulse += (bassPulse - previousBassPulse) * 0.22;
}

function drawShockwaves(width, height, deltaTime) {
  if (!shockwaves.length) return;

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
    ctx.strokeStyle = `rgba(${accentRgb}, ${wave.life * 0.34})`;
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
  const accentRgb = getThemeColor("--accent-rgb");
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
    ctx.strokeStyle = `rgba(${band.color}, ${0.035 + magnitude * 0.17})`;
    ctx.lineWidth = 0.6 + magnitude * 1.2;
    ctx.shadowColor = `rgba(${band.color}, 0.65)`;
    ctx.shadowBlur = 6 + magnitude * 8;
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
    ctx.strokeStyle = `rgba(${accentRgb}, ${burst.life * 0.34})`;
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
  analyser.smoothingTimeConstant = 0.82;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;

  frequencyData = new Uint8Array(analyser.frequencyBinCount);
  waveformData = new Uint8Array(analyser.fftSize);
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

function drawFrequencyBars(width, height, energy) {
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

function drawSpectrumField(width, height, energy, time) {
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

    ctx.strokeStyle =
      depth > 0.82 && energy > 0.52
        ? warning
        : `rgba(${accentRgb}, ${alpha})`;
    ctx.lineWidth = 0.55 + perspective * 1.15;
    ctx.shadowColor = `rgba(${accentRgb}, 0.65)`;
    ctx.shadowBlur = perspective * (4 + energy * 8);
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

    captureSpectrumHistory(now);
    detectBeat(now);
    drawVisualizerBackdrop(width, height, energy, now);
    if (visualizationMode === "frequency") drawFrequencyBars(width, height, energy);
    else if (visualizationMode === "waveform") drawWaveform(width, height, energy);
    else if (visualizationMode === "orbit") drawOrbit(width, height, energy, now);
    else drawSpectrumField(width, height, energy, now);

    drawSignalNetwork(width, height, energy, now);
    drawEnergyArcs(width, height, energy, now, deltaTime);
    spawnParticles(width, height, energy);
    drawParticles(deltaTime);
    drawShockwaves(width, height, deltaTime);
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
          : visualizationMode === "orbit"
            ? "Signal orbit"
            : "Spectral field";
    visualModeLabel.textContent =
      visualizationMode === "frequency"
        ? "SPECTRUM / LIVE"
        : visualizationMode === "waveform"
          ? "TIME DOMAIN / LIVE"
          : visualizationMode === "orbit"
            ? "RADIAL MAP / LIVE"
            : "HISTORY FIELD / LIVE";
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
  captureStream?.getTracks().forEach((track) => track.stop());
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

resizeCanvas();
animate();
