// All sound is synthesized with the Web Audio API — no audio files.
// The music is an original, gentle music-box waltz.
import { persist } from './save.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// 3/4 time, one entry per beat: [melody midi or null, chord root midi]
const CHORDS = {
  C: [48, 52, 55],
  Am: [45, 48, 52],
  F: [41, 45, 48],
  G: [43, 47, 50],
  Em: [40, 43, 47],
  Dm: [38, 41, 45],
};
const SONG = [
  ['C', [76, 79, 84]],
  ['Am', [83, 81, 76]],
  ['F', [77, 81, 84]],
  ['G', [83, null, 79]],
  ['C', [76, 79, 84]],
  ['Em', [83, 79, 76]],
  ['F', [77, 76, 74]],
  ['G', [74, null, 71]],
  ['Am', [72, 76, 81]],
  ['F', [81, 79, 77]],
  ['Dm', [77, 74, 77]],
  ['G', [79, null, 74]],
  ['C', [76, 74, 72]],
  ['F', [77, 76, 74]],
  ['G', [71, 74, 79]],
  ['C', [72, null, null]],
];
const BEAT = 60 / 92;

export class Audio {
  constructor(save) {
    this.save = save;
    this.ctx = null;
    this.timer = null;
    this.nextTime = 0;
    this.step = 0;
  }

  /** Must be called from a user gesture (browsers block audio until then). */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.5;
      this.sfxBus.connect(this.master);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.22;
      this.musicBus.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.save.music) this.startMusic();
  }

  tone(freq, start, dur, { type = 'sine', vol = 0.3, attack = 0.005, bus = this.sfxBus, slideTo = null } = {}) {
    const c = this.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(bus);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  /** A soft bell: sine plus a quiet octave partial. */
  bell(freq, start, dur, vol, bus) {
    this.tone(freq, start, dur, { vol, bus });
    this.tone(freq * 2, start, dur * 0.6, { vol: vol * 0.25, bus });
    this.tone(freq * 3, start, dur * 0.3, { vol: vol * 0.08, bus });
  }

  play(name) {
    if (!this.ctx || !this.save.sfx) return;
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'pick':
        this.tone(520, t, 0.08, { type: 'triangle', vol: 0.25, slideTo: 780 });
        break;
      case 'place':
        this.tone(330, t, 0.12, { type: 'triangle', vol: 0.3, slideTo: 260 });
        this.tone(1320, t, 0.05, { vol: 0.05 });
        break;
      case 'swap':
        this.tone(440, t, 0.07, { type: 'triangle', vol: 0.25 });
        this.tone(554, t + 0.06, 0.09, { type: 'triangle', vol: 0.25 });
        break;
      case 'click':
        this.tone(900, t, 0.04, { type: 'square', vol: 0.06 });
        break;
      case 'wrong':
        this.tone(311, t, 0.16, { type: 'triangle', vol: 0.3 });
        this.tone(262, t + 0.14, 0.24, { type: 'triangle', vol: 0.3 });
        break;
      case 'hint':
        this.bell(1175, t, 0.4, 0.15, this.sfxBus);
        this.bell(1568, t + 0.1, 0.5, 0.12, this.sfxBus);
        break;
      case 'solve':
        [72, 76, 79, 84, 88].forEach((n, i) => this.bell(midi(n), t + i * 0.11, 1.2, 0.22, this.sfxBus));
        break;
      default:
        break;
    }
  }

  startMusic() {
    if (!this.ctx || this.timer) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = setInterval(() => this.schedule(), 60);
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      const bar = SONG[Math.floor(this.step / 3) % SONG.length];
      const beat = this.step % 3;
      const [chordName, melody] = bar;
      const chord = CHORDS[chordName];
      const t = this.nextTime;
      if (beat === 0) this.tone(midi(chord[0] - 12), t, BEAT * 2.5, { type: 'triangle', vol: 0.35, bus: this.musicBus, attack: 0.02 });
      else this.bell(midi(chord[beat] + 12), t, BEAT * 1.2, 0.12, this.musicBus);
      const note = melody[beat];
      if (note) this.bell(midi(note), t, BEAT * 2.2, 0.3, this.musicBus);
      this.nextTime += BEAT;
      this.step++;
    }
  }

  setMusic(on) {
    this.save.music = on;
    persist(this.save);
    if (on) {
      this.unlock();
      this.startMusic();
    } else this.stopMusic();
  }

  setSfx(on) {
    this.save.sfx = on;
    persist(this.save);
    if (on) this.play('click');
  }
}
