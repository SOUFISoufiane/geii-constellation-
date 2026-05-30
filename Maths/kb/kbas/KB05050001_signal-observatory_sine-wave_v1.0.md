# KB05050001: Signal Observatory

## 1. Feature Description
Signal Observatory is the toolbox's flagship Fourier/signal-processing app: 32 signals,
9 fusion modes, and 8 filter types, with animated players and a formula panel.

## 2. How-To Use
1. Open the GEII Visual Toolbox Galaxy, click the **Signal Observatory** star.
2. Pick a signal from the sidebar (20 GEII signals + 12 extras) and adjust its parameters
   in the params board.
3. Choose a **fusion mode** from the dropdown — e.g. ① Parseval (energy equivalence),
   ② Bode / Nyquist (stability), ④ STFT spectrogram, ⑥ Convolution s ∗ h, ⑦ Bode pur,
   ⑧ Nyquist pur, ⑨ Waterfall 3D, or **⑭ Audio DSP Analyzer**.
4. **For ⑭ Audio DSP**:
   - Drag and drop any local audio file (.wav, .mp3, .ogg, .flac) onto the screen.
   - Use the transport controls (Play, Pause, Stop, Scrubber) to navigate the file.
   - Adjust the FFT Size and Windowing Function in the controls board.
   - Observe the real-time Oscilloscope, Phase, and 2D/3D Spectrograms.
   - *Note on Performance:* Large .wav files use a chunked data stream to generate the 3D surface without memory crashes. For stability, compressed files (>10MB) will skip generating the offline 3D surface but will stream playback flawlessly.
5. For other modes, toggle a filter (Butterworth and others) and watch its effect across modes.
6. Use the players to animate the winding frequency / time evolution.

## 3. Expected Outcome
The selected signal is shown through the chosen analytical lens (time, frequency, complex
plane, or time-frequency), with the relevant equations in the formula panel — all reacting
live to parameter and filter changes.

## 4. Related Articles
- KB03050001: Math Visualizer (Laplace / ODE companion).
- SOP_signal-observatory_v1.0 (maintenance & conventions).
