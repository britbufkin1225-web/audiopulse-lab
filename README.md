# AudioPulse Lab

AudioPulse Lab is a browser-based audio intelligence dashboard built with
HTML, CSS, vanilla JavaScript, and the Web Audio API. It turns a local audio
file into a real-time frequency spectrum, waveform, bass-energy meter, and
peak-level monitor.

The project is intentionally dependency-free and keeps all audio processing
inside the browser. Uploaded files are not sent to a server.

## Features

- Local audio upload for formats supported by the browser
- Live browser-tab and system-audio capture with explicit user permission
- Play, pause, and timeline seeking
- Animated frequency bars rendered on an HTML canvas
- Mirrored spectrum reflections with falling peak caps
- Layered time-domain waveform visualization
- Circular Orbit mode with radial spectrum and waveform rings
- 3D-style Field mode with scrolling frequency history and depth fog
- Beat-triggered shockwaves shared across visualization modes
- Audio-reactive signal nodes connected by dynamic filaments
- Rotating bass, mid, and treble energy arcs with beat bursts
- Subtle cyan and magenta chromatic bloom
- Manual sensitivity, smoothing, intensity, and motion controls
- Independent ambient-overlay and beat-effect toggles
- Optional audio-reactive neon beams, ribbons, and illuminated canvas edges
- Multi-speed color rain with frequency-reactive density, streaks, and droplets
- Rotating geometric lattices with frequency-reactive polygon vertices
- Mirrored recursive fractal branches that grow and sway with the signal
- Gigantic macro forms with slow parallax, color refraction, and bass-reactive scale
- Dubstep-inspired visual bass stutter with gated frame slices and repeating pulse rings
- Trip visuals with kaleidoscope petals, a receding tunnel, and chromatic ribbon trails
- Canvas-native 3D depth with a perspective floor and approaching wireframe solids
- Automatic scene director with timed scenes and bass-drop transitions
- Canvas recording exported as a downloadable WebM visual performance
- Versioned JSON preset export and validated preset import
- Neon, cyan, magenta, amber, custom, animated Prismatic, and Oil Slick color moods
- Audio-reactive liquid membrane with flowing interference colors in Oil Slick mode
- Five canvas rendering styles: Cyber, Hologram, Laser, Minimal, and Aurora
- Locally persisted visual preferences with one-click reset
- Fullscreen presentation mode
- Beat-reactive glow, particles, scan line, and signal HUD
- Bass-energy analysis across approximately 20-250 Hz
- Peak-level estimate in decibels
- File name, type, size, and duration metadata
- Dark cyberpunk interface with an alternate light theme
- Responsive layouts for desktop, tablet, and mobile
- High-DPI canvas rendering
- Local-only audio processing

## Live Project

Repository:
[github.com/britbufkin1225-web/audiopulse-lab](https://github.com/britbufkin1225-web/audiopulse-lab)

## Technology

| Technology | Purpose |
| --- | --- |
| HTML5 | Semantic dashboard structure, file input, audio element, and controls |
| CSS3 | Responsive layout, themes, meter styling, and cyberpunk presentation |
| JavaScript | Audio state, metrics, canvas rendering, and user interaction |
| Web Audio API | Audio routing and real-time signal analysis |
| Canvas API | Frequency-bar and waveform rendering |
| `requestAnimationFrame` | Browser-synchronized animation loop |

No framework, package manager, build tool, or backend is required.

## Project Structure

```text
audiopulse-lab/
|-- index.html       # Dashboard markup and controls
|-- style.css        # Responsive themes and interface styling
|-- app.js           # Web Audio pipeline, analysis, and visualization
|-- README.md        # Project and developer documentation
`-- OPERATIONS.md    # Operating and troubleshooting instructions
```

## Quick Start

### Option 1: Open Directly

Open `index.html` in a modern browser. Most features work directly from the
local file, although a local web server is recommended for consistent browser
behavior.

### Option 2: Run a Local Server

From the project directory, use any available static server.

Python:

```bash
python -m http.server 4173
```

Node.js:

```bash
npx serve .
```

Then open:

```text
http://localhost:4173
```

See [OPERATIONS.md](OPERATIONS.md) for complete user instructions.

## How to Use

1. Select **Load audio file**.
2. Choose an audio file from the local device.
3. Review the detected file metadata.
4. Press the main play button to begin playback and analysis.
5. Select **BARS**, **WAVE**, **ORBIT**, or **FIELD** for the preferred display.
6. Use the expand button to present the visualizer in fullscreen.
7. Drag the timeline to seek through the track.
8. Use the theme button in the upper-right corner to switch themes.

### Manual Visualizer Controls

The control deck applies to local files and live tab capture:

| Control | Effect |
| --- | --- |
| Sensitivity | Amplifies or reduces analyzer response |
| Smoothing | Controls how quickly frequency values change |
| Intensity | Scales glow, reactions, and visual energy |
| Motion | Changes animation speed; `0%` freezes procedural motion |
| Ambient overlays | Toggles nodes, filaments, particles, and energy arcs |
| Beat effects | Toggles beat-triggered shockwaves and arc bursts |
| Auto director | Cycles curated scenes every 14 seconds or on strong drops |
| Visual recording | Records the canvas and downloads a silent WebM video |
| Preset sharing | Exports or imports the complete visual setup as JSON |
| Color mood | Applies a preset or custom accent across the complete dashboard |
| Visual style | Changes geometry, glow, reflections, layering, and overlay density |

The five styles are:

- **Cyber:** solid bars, peak caps, reflections, and full overlays.
- **Hologram:** wireframe bars, finer glow, and stronger scan treatment.
- **Laser:** narrow high-energy beams with bright frequency peaks.
- **Minimal:** restrained lines, almost no glow, and reduced overlays.
- **Aurora:** rounded gradient bars with cyan and magenta layering.

**Prismatic** is the multicolor mode. It maps different hues to different
frequency positions at the same time, then slowly rotates the palette. Bars,
wave layers, orbit spokes, spectral-field rows, particles, nodes, arcs, and
beat pulses all receive coordinated but distinct colors.

Settings are saved in browser local storage. Select **Reset** to restore the
default values, Neon mood, and Cyber style.

### Analyze YouTube or Another Music App

1. Open the music source in another browser tab.
2. Select **Share tab audio** in AudioPulse Lab.
3. Choose the music tab in the browser picker.
4. Enable **Share tab audio** in the picker.
5. Select **Share** and start playback in the music tab.
6. Return to AudioPulse Lab or use fullscreen mode.
7. Select **Stop live capture** when finished.

Tab capture requires a secure context such as HTTPS or localhost. The browser
always requires the user to choose what is shared; the app cannot silently
capture another tab.

AudioContext initialization happens after the play button is pressed because
modern browsers require a user gesture before audio can start.

## Audio Architecture

The application uses this signal path:

```text
Local audio file
      |
      v
HTMLAudioElement
      |
      v
MediaElementAudioSourceNode
      |
      +----> AnalyserNode ----> Canvas and dashboard meters
      |
      `----> AudioContext destination ----> Speakers or headphones
```

Live capture uses a separate path:

```text
User-approved browser tab or screen
      |
      v
MediaStreamAudioSourceNode
      |
      v
AnalyserNode
```

Captured audio is not connected to the app's output destination because the
shared tab already plays it. This avoids delayed echo.

The `AnalyserNode` observes the signal without modifying it. Local playback
uses a parallel connection from the media source to the output destination.

### Analyzer Configuration

The analyzer uses:

```javascript
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.82;
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
```

An FFT size of 2048 produces 1024 frequency bins. The visualizer maps those
bins onto a smaller number of bars and uses a curved index to give more screen
space to low and mid frequencies.

## Dashboard Metrics

### Frequency Spectrum

`getByteFrequencyData()` fills a byte array with the current magnitude of each
frequency bin. The renderer converts those magnitudes into vertical canvas
bars with a theme-aware gradient.

### Waveform

`getByteTimeDomainData()` captures the current time-domain signal. Samples are
converted into canvas coordinates and joined into a continuous line.

### Bass Energy

The app calculates the frequency width of each FFT bin from the audio context
sample rate and analyzer FFT size. It averages the bins covering approximately
20-250 Hz and presents the result as a percentage.

The labels are:

| Value | Label |
| --- | --- |
| 0-35% | Low Energy |
| 36-70% | Active Range |
| 71-100% | High Intensity |

### Peak Level

The peak meter finds the greatest waveform displacement from silence and
converts the normalized amplitude to decibels:

```text
dB = 20 * log10(amplitude)
```

The visual meter displays the range from approximately `-48 dB` to `0 dB`.
The peak indicator illuminates above `-3 dB`.

These values are useful visual estimates, not calibrated studio measurements.

## Animation and Rendering

The app uses a continuous `requestAnimationFrame` loop. On each frame it:

1. Clears the canvas.
2. requests current analyzer data.
3. Draws the selected visualization.
4. Calculates bass and peak metrics.
5. Updates the dashboard.
6. schedules the next frame.

The canvas is resized using the device pixel ratio, capped at `2`, to improve
sharpness without creating unnecessarily large drawing buffers.

## Privacy

- Audio files are loaded with `URL.createObjectURL()`.
- Files remain on the user's device.
- The application has no upload endpoint, analytics integration, or database.
- Previous object URLs are revoked when another file is selected.
- The final object URL is revoked when the page closes.

The Google Fonts stylesheet is the only external resource requested by the
interface. The selected audio itself is never transmitted.

## Browser Compatibility

Use a current version of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

Actual audio format support depends on the browser and operating system. MP3,
WAV, and OGG are broadly supported. M4A/AAC support can vary.

## Development

There is no build step. Edit the source files and refresh the browser.

Run a JavaScript syntax check with:

```bash
node --check app.js
```

Suggested manual verification:

1. Load a supported audio file.
2. Confirm metadata and duration appear.
3. Play and pause the track.
4. Confirm bars react to the audio.
5. Switch to waveform mode.
6. Confirm bass and peak meters update.
7. Seek to another part of the track.
8. Switch themes.
9. Resize the viewport and verify the responsive layout.
10. Load a second file and confirm it replaces the first.

## Design Decisions

- **Vanilla stack:** keeps the implementation easy to inspect and deploy.
- **One analyzer:** supplies both frequency-domain and time-domain data.
- **Lazy AudioContext:** satisfies browser autoplay restrictions.
- **Local object URLs:** avoid reading or uploading complete audio files.
- **Responsive bar count:** preserves useful density across viewport sizes.
- **CSS custom properties:** allow the canvas and interface to share themes.

## Limitations

- The peak meter is an instantaneous visualization, not a calibrated LUFS,
  RMS, or true-peak meter.
- Frequency labels are visual guides rather than exact bar boundaries.
- Audio format support is controlled by the browser.
- Theme choice is not persisted after the page is closed.
- The project does not record microphone input or export analysis data.

## Future Improvements

- Drag-and-drop file loading
- Volume and mute controls
- Persistent theme preference
- RMS and loudness measurements
- Spectrogram mode
- Audio analysis export
- Keyboard shortcuts
- Automated browser tests
- GitHub Pages deployment

## License

No license has been added. Copyright remains with the repository owner unless a
license is added later.
