# AudioPulse Lab Operations Guide

This guide explains how to start, operate, verify, troubleshoot, and maintain
AudioPulse Lab.

## 1. System Requirements

AudioPulse Lab requires:

- A modern desktop or mobile web browser
- JavaScript enabled
- Speakers or headphones
- A local audio file in a browser-supported format

No account, backend service, installation, or internet connection is required
for audio analysis. The interface may fall back to system fonts when offline.

## 2. Starting the Application

### Direct File Method

Open `index.html` from the project directory.

This is suitable for a quick demonstration. If a browser applies restrictions
to local files, use the local server method.

### Local Server Method

Open a terminal in the project directory.

With Python:

```bash
python -m http.server 4173
```

With Node.js and `npx`:

```bash
npx serve .
```

Open the address printed by the server. For the Python example, use:

```text
http://localhost:4173
```

To stop the server, return to its terminal and press `Ctrl+C`.

## 3. Normal Operating Procedure

### Load a File

1. Select **Load audio file**.
2. Choose a local audio file.
3. Wait for the dashboard to display its name, type, size, and duration.

The system status changes from `SYSTEM READY` to `SIGNAL LOADED`.

Selecting another file replaces the current track. The previous browser object
URL is released automatically.

### Start Analysis

1. Check the computer's output volume.
2. Press the large play button.
3. Allow audio playback if the browser displays a permission prompt.

The first play action creates the Web Audio pipeline. While playback is active,
the status reads `ANALYZING SIGNAL`.

### Pause and Resume

- Press the same transport button to pause.
- Press it again to resume.

The track retains its current position while paused.

### Seek

Drag or click the horizontal timeline. The left time value shows the current
position, and the right value shows total duration.

### Change Visualization

- Select **BARS** to view the frequency spectrum.
- Select **WAVE** to view the time-domain waveform.
- Select **ORBIT** to view the circular spectrum, waveform ring, and
  beat-reactive core.
- Select **FIELD** to view recent frequency snapshots as a scrolling,
  perspective signal landscape.

Changing modes does not interrupt playback.

All modes also share a dynamic overlay layer. Signal nodes, connecting
filaments, rotating energy arcs, chromatic bloom, and beat bursts respond to
different frequency ranges without changing the underlying analysis.

### Fullscreen Visualization

Select the expand icon beside the mode controls to enter fullscreen. Press
`Esc` or select the control again to return to the dashboard.

### Read Bass Energy

The Bass Energy card estimates activity between 20 Hz and 250 Hz.

| Display | Interpretation |
| --- | --- |
| Low Energy | Limited low-frequency activity |
| Active Range | Moderate bass content |
| High Intensity | Strong bass content |

The percentage is relative to the analyzer byte range. It is not a calibrated
acoustic measurement.

### Read Peak Level

The Peak Level card estimates instantaneous signal amplitude in decibels.

- Values closer to `0 dB` indicate a stronger signal.
- `-∞ dB` indicates silence or no analyzed signal.
- The indicator illuminates above approximately `-3 dB`.

This display is intended for visualization and comparison, not mastering or
compliance work.

### Change Theme

Select the sun-shaped button in the upper-right corner to toggle between the
dark cyberpunk theme and the light theme.

The selection applies only to the current page session.

## 4. Status Messages

| Status | Meaning |
| --- | --- |
| `SYSTEM READY` | The app is loaded and waiting for a file |
| `SIGNAL LOADED` | A local file has been selected |
| `ANALYZING SIGNAL` | Audio is playing and analysis is active |
| `SIGNAL PAUSED` | Playback has been paused |
| `ANALYSIS COMPLETE` | Playback reached the end of the track |

## 5. Expected Behavior

After a valid audio file is loaded and played:

- Sound is audible through the selected system output.
- The frequency bars or waveform animate.
- Bass and peak metrics change with the signal.
- The play control changes to a pause icon.
- The timeline advances.
- File metadata remains visible.

When playback is paused:

- The timeline stops advancing.
- The play control returns to its play icon.
- The canvas retains analyzer output from the current animation cycle.

## 6. Troubleshooting

### The Play Button Is Disabled

Cause: No audio file has been selected.

Resolution:

1. Select **Load audio file**.
2. Choose a supported local audio file.
3. Confirm its name appears under **Now Analyzing**.

### The File Loads but Does Not Play

Possible causes:

- The browser does not support the file's codec.
- The file is damaged.
- Browser audio is muted.
- The operating system is using the wrong output device.

Resolution:

1. Try a known-good MP3 or WAV file.
2. Check the browser tab's mute state.
3. Check system volume and output-device selection.
4. Reload the page and select the file again.
5. Try a current version of Chrome, Edge, Firefox, or Safari.

### Audio Plays but the Visualization Does Not Move

Resolution:

1. Confirm JavaScript is enabled.
2. Refresh the page.
3. Load the track again.
4. Start playback with the app's play button rather than browser media keys.
5. Open the browser developer console and look for Web Audio or canvas errors.

### The Browser Blocks Playback

Modern browsers prevent audio from starting without user interaction.

Resolution: press the app's play button manually. Do not attempt to start
playback automatically from the console or page load.

### M4A or OGG Does Not Work

Container and codec support differs by browser.

Resolution:

1. Try the same file in another current browser.
2. Convert the file to MP3 or WAV.
3. Confirm the file extension matches its actual encoding.

### The Canvas Looks Blurry

Resolution:

1. Return browser zoom to 100%.
2. Resize the browser window to trigger canvas resizing.
3. Refresh the page after moving it between displays with different scaling.

The app already accounts for device pixel ratio up to `2`.

### Google Fonts Do Not Load

Cause: The device is offline or access to Google Fonts is blocked.

Impact: The app remains functional and uses fallback fonts.

### Metrics Appear Too High or Too Low

The dashboard metrics are visual estimates derived from analyzer byte data.
They are affected by the source recording and analyzer settings.

Do not use the current meters for:

- Broadcast compliance
- Hearing-safety decisions
- Studio calibration
- LUFS targets
- True-peak certification

## 7. Privacy and Data Handling

AudioPulse Lab processes selected files locally:

1. The browser creates a temporary object URL for the selected file.
2. The HTML audio element reads from that object URL.
3. The Web Audio API analyzes the playback signal.
4. No audio bytes are uploaded by the application.
5. The object URL is revoked when replaced or when the page closes.

For highly sensitive audio, run the project offline. The interface's Google
Fonts request can also be removed from `style.css` for a fully offline setup.

## 8. Verification Checklist

Run this checklist after changing the application:

- [ ] The page loads without console errors.
- [ ] The initial status reads `SYSTEM READY`.
- [ ] The play button is disabled before file selection.
- [ ] A valid audio file displays correct metadata.
- [ ] The play button starts audible playback.
- [ ] The pause button stops playback.
- [ ] The timeline advances and seeking works.
- [ ] Frequency bars react to audio.
- [ ] Waveform mode draws a continuous line.
- [ ] Orbit mode draws a reactive circular spectrum.
- [ ] Field mode draws a scrolling perspective spectrum.
- [ ] Signal nodes and energy arcs respond without obscuring the main mode.
- [ ] Fullscreen mode opens and exits without stretching the canvas.
- [ ] Bass energy updates.
- [ ] Peak level updates and the warning indicator can activate.
- [ ] A second file replaces the first cleanly.
- [ ] Theme toggling updates the interface and canvas color.
- [ ] Desktop, tablet, and mobile layouts remain usable.
- [ ] Keyboard focus indicators are visible.

Run the JavaScript syntax check:

```bash
node --check app.js
```

## 9. Maintenance Procedure

### Before Editing

```bash
git status
git pull
```

Review local changes before editing so unrelated work is not overwritten.

### After Editing

1. Run `node --check app.js`.
2. Start a local server.
3. Complete the verification checklist.
4. Review the Git diff.
5. Commit the intended files.
6. Push the branch.

Example:

```bash
git diff
git add index.html style.css app.js README.md OPERATIONS.md
git commit -m "Describe the change"
git push
```

### Dependency Maintenance

The application has no JavaScript package dependencies. The external Google
Fonts import in `style.css` is the only hosted presentation dependency.

## 10. Configuration Reference

Core analyzer settings are defined in `initializeAudioPipeline()` in `app.js`.

| Setting | Current Value | Effect |
| --- | --- | --- |
| `fftSize` | `2048` | Frequency resolution and waveform buffer size |
| `smoothingTimeConstant` | `0.82` | Smooths rapid changes between frames |
| `minDecibels` | `-90` | Lower frequency-data threshold |
| `maxDecibels` | `-10` | Upper frequency-data threshold |

Use caution when changing these settings:

- Larger FFT sizes improve frequency resolution but increase buffer size.
- Higher smoothing produces steadier bars but slower visual response.
- Decibel bounds change how signal strength maps into byte values.

## 11. Recovery

If a change breaks the app:

1. Inspect the browser console.
2. Run `node --check app.js`.
3. Review `git diff`.
4. Compare changed element IDs with the selectors in `app.js`.
5. Confirm CSS custom properties still provide `--accent` and
   `--accent-rgb`.
6. Use Git history to identify the last working commit.

Do not discard uncommitted work until it has been reviewed or backed up.
