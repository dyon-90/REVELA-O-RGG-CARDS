/**
 * Web Audio API synthesizer for tactile sounds:
 * - Lamp toggle click (satisfying mechanical switch / abajur cord sound)
 * - Warm lamp filament power surge
 * - Playing card slide/flick sound
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Play the click of an antique abajur lamp toggle / pull-chain
   */
  public playLampSwitchSound(turningOn: boolean = true) {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Mechanical switch click (sharp transient)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(turningOn ? 1800 : 1200, now);
    clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    clickGain.gain.setValueAtTime(0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.045);

    // 2. Secondary mechanical latch click (dual contact sound like a real switch)
    setTimeout(() => {
      if (!this.enabled) return;
      const ctx2 = this.getContext();
      if (!ctx2) return;
      const t2 = ctx2.currentTime;

      const click2 = ctx2.createOscillator();
      const gain2 = ctx2.createGain();
      click2.type = 'sine';
      click2.frequency.setValueAtTime(turningOn ? 850 : 600, t2);
      click2.frequency.exponentialRampToValueAtTime(80, t2 + 0.035);

      gain2.gain.setValueAtTime(0.25, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.035);

      click2.connect(gain2);
      gain2.connect(ctx2.destination);
      click2.start(t2);
      click2.stop(t2 + 0.04);
    }, 28);

    // 3. Warm filament harmonic hum (only when turning ON)
    if (turningOn) {
      const humOsc = ctx.createOscillator();
      const humGain = ctx.createGain();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(140, now);
      humOsc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

      humGain.gain.setValueAtTime(0.001, now);
      humGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      humGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      humOsc.connect(humGain);
      humGain.connect(ctx.destination);
      humOsc.start(now);
      humOsc.stop(now + 0.5);
    }
  }

  /**
   * Play smooth card slide / deck shuffle sound
   */
  public playCardFlickSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Play 3D card turnover whoosh sound as the card spins through the air
   */
  public playCardFlipWhoosh() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Filtered noise swoosh for the wind displacement of the flipping card
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(950, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.24);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.25);
  }
}

export const soundEngine = new SoundEngine();
