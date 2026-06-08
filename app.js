const audio = document.querySelector("#audio");
const audioFile = document.querySelector("#audioFile");
const playButton = document.querySelector("#playButton");
const seekBar = document.querySelector("#seekBar");
const canvas = document.querySelector("#visualizer");
const canvasEmpty = document.querySelector("#canvasEmpty");
const ctx = canvas.getContext("2d");

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

function drawFrequencyBars(width, height) {
  analyser.getByteFrequencyData(frequencyData);

  const barCount = Math.max(24, Math.min(96, Math.floor(width / 9)));
  const gap = 3;
  const barWidth = (width - gap * (barCount - 1)) / barCount;
  const usableHeight = height - 34;
  const gradient = ctx.createLinearGradient(0, usableHeight, 0, 0);

  gradient.addColorStop(0, getThemeColor("--accent"));
  gradient.addColorStop(0.72, getThemeColor("--accent"));
  gradient.addColorStop(1, getThemeColor("--warning"));

  ctx.fillStyle = gradient;
  ctx.shadowColor = `rgba(${getThemeColor("--accent-rgb")}, 0.35)`;
  ctx.shadowBlur = 8;

  for (let index = 0; index < barCount; index += 1) {
    // A curved index gives extra screen space to bass and mids, where most
    // musical detail lives, instead of drawing every FFT bin one-for-one.
    const normalizedIndex = index / barCount;
    const dataIndex = Math.floor(Math.pow(normalizedIndex, 2.15) * (frequencyData.length - 1));
    const magnitude = frequencyData[dataIndex] / 255;
    const barHeight = Math.max(2, magnitude * usableHeight);
    const x = index * (barWidth + gap);
    const y = usableHeight - barHeight;

    ctx.fillRect(x, y, Math.max(1, barWidth), barHeight);
  }

  ctx.shadowBlur = 0;
}

function drawWaveform(width, height) {
  analyser.getByteTimeDomainData(waveformData);

  ctx.lineWidth = 2;
  ctx.strokeStyle = getThemeColor("--accent");
  ctx.shadowColor = `rgba(${getThemeColor("--accent-rgb")}, 0.55)`;
  ctx.shadowBlur = 12;
  ctx.beginPath();

  const sliceWidth = width / (waveformData.length - 1);
  for (let index = 0; index < waveformData.length; index += 1) {
    const sample = waveformData[index] / 128;
    const x = index * sliceWidth;
    const y = (sample * (height - 34)) / 2;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.shadowBlur = 0;
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
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  if (analyser) {
    if (visualizationMode === "frequency") drawFrequencyBars(width, height);
    else drawWaveform(width, height);
    updateMetrics();
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
    document.querySelectorAll(".mode-button").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    visualizerTitle.textContent =
      visualizationMode === "frequency" ? "Frequency spectrum" : "Signal waveform";
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
