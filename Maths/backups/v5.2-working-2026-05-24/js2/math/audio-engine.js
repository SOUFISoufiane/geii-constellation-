// ═══════════════════════════════════════════════════════════════════
//  AUDIO ENGINE — Web Audio API wrapper for Live Input
// ═══════════════════════════════════════════════════════════════════

export class AudioEngine {
    constructor() {
        this.context = null;
        this.analyser = null;
        this.stream = null;
        this.source = null;
        this.timeData = new Float32Array(1024);
        this.freqData = new Uint8Array(512);
        this.isActive = false;
        
        // Expose a global toggle method
        window.toggleMicrophone = () => this.toggle();
    }

    async toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            await this.start();
        }
    }

    async start() {
        if (this.isActive) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 1024;
            this.source = this.context.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);
            this.isActive = true;
            console.log("Audio Engine Started");
            const btn = document.getElementById('mic-btn');
            if (btn) btn.style.color = '#ff4d6d'; // red recording
        } catch (e) {
            console.error("Audio Engine Error:", e);
            alert("Microphone access denied or unavailable.");
        }
    }

    stop() {
        if (!this.isActive) return;
        if (this.stream) this.stream.getTracks().forEach(t => t.stop());
        if (this.context) this.context.close();
        this.isActive = false;
        this.timeData.fill(0);
        this.freqData.fill(0);
        const btn = document.getElementById('mic-btn');
        if (btn) btn.style.color = 'inherit';
    }

    update() {
        if (!this.isActive || !this.analyser) {
            this.timeData.fill(0);
            this.freqData.fill(0);
            return;
        }
        this.analyser.getFloatTimeDomainData(this.timeData);
        this.analyser.getByteFrequencyData(this.freqData);
    }
}

export const audioEngine = new AudioEngine();