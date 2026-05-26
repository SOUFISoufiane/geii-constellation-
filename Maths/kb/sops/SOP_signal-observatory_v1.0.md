# SOP_signal-observatory_v1.0

## 1. Objective
To document the standard operating procedures for the Signal Observatory app.

## 2. Scope
Applies to `Maths/apps/signal-observatory/`.

## 3. Procedure
1. **Adding Filters**: Add new signal processing filters in the `js/` directory.
2. **Chart Rendering**: Ensure the charting library or canvas logic inside `index.html` and `js/` remains performant. 
3. **Data Pipelines**: Maintain the Web Worker scripts if heavy computation is moved off the main thread.

## 4. Troubleshooting
- **Lagging UI**: If the signal sampling rate is too high, it might freeze the browser. Check the downsampling logic.

## 5. Revision History
- **v1.0**: Initial Creation.
