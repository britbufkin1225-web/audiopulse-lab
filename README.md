# AudioPulse Lab

AudioPulse Lab is a browser-based audio intelligence dashboard built with
HTML, CSS, vanilla JavaScript, and the Web Audio API. It turns a local audio
file into a real-time frequency spectrum, waveform, bass-energy meter, and
peak-level monitor.

The project is intentionally dependency-free and keeps all audio processing
inside the browser. Uploaded files are not sent to a server.

## Features

- Local audio upload for formats supported by the browser
- Play, pause, and timeline seeking
- Animated frequency bars rendered on an HTML canvas
- Time-domain waveform visualization
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
5. Select **BARS** for the frequency spectrum or **WAVE** for the waveform.
6. Drag the timeline to seek through the track.
7. Use the theme button in the upper-right corner to switch themes.

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
      v
AnalyserNode
      |
      +----> Frequency and waveform data ----> Canvas and dashboard meters
      |
      v
AudioContext destination
      |
      v
Speakers or headphones
```

The `AnalyserNode` observes the signal without modifying it. The audio then
continues to the browser's output destination for normal playback.

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

