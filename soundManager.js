export class SoundManager {
  constructor() {
    this.audioContext = null;
  }

  initialize() {
    try {
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioContext = new AudioContextClass();
      }
      if (this.audioContext?.state === "suspended") this.audioContext.resume();
    } catch (error) {
      console.warn("Audio could not be initialized:", error);
    }
  }

  playShot() {
    const audio = this.audioContext;
    if (!audio) return;

    const startTime = audio.currentTime;
    const sampleCount = Math.floor(audio.sampleRate * 0.14);
    const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
    const samples = buffer.getChannelData(0);

    for (let index = 0; index < sampleCount; index += 1) {
      samples[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / sampleCount, 3);
    }

    const noiseSource = audio.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseGain = audio.createGain();
    noiseGain.gain.value = 0.22;
    noiseSource.connect(noiseGain).connect(audio.destination);
    noiseSource.start(startTime);

    const oscillator = audio.createOscillator();
    const oscillatorGain = audio.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(260, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, startTime + 0.12);
    oscillatorGain.gain.setValueAtTime(0.18, startTime);
    oscillatorGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.13);
    oscillator.connect(oscillatorGain).connect(audio.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.14);
  }

  playHurt() {
    const audio = this.audioContext;
    if (!audio) return;

    const startTime = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(200, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(80, startTime + 0.2);
    gain.gain.setValueAtTime(0.15, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.23);
  }

  playReload() {
    const audio = this.audioContext;
    if (!audio) return;

    [0, 0.9].forEach(delay => {
      const startTime = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = delay ? 420 : 260;
      oscillator.type = "square";
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    });
  }
}
