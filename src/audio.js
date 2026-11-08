// All sound is synthesized with the Web Audio API — no audio files.
// Music is original music-box waltzes, stored as data in songs.js.
import { persist } from './save.js';

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

import { TITLE_SONG } from './songs.js';

/** Which little voice each kind of decoration uses (unknown kinds get a soft "tok"). */
const CATEGORY_VOICE = {
  bell: 'jingle', ornament: 'tink', star: 'twinkle', lights: 'tink', ribbon: 'rustle', gift: 'rustle',
  stocking: 'rustle', candle: 'whoosh', lantern: 'whoosh', treat: 'tok', figure: 'tok', nature: 'tok',
  pumpkin: 'thunk', critter: 'squeak', spooky: 'oooh', potion: 'bloop', candy: 'rustle', hat: 'whoosh',
};

export class Audio {
  constructor(save) {
    this.save = save;
    this.ctx = null;
    this.timer = null;
    this.nextTime = 0;
    this.step = 0;
    this.song = TITLE_SONG;
  }

  /** Switch tunes (each scene asks for its holiday's song); restarts at bar 1. */
  setSong(song) {
    if (!song || song === this.song) return;
    this.song = song;
    this.step = 0;
    if (this.ctx) this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.3);
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

  /** Short filtered noise burst (rustles, whooshes, puffs). */
  noise(start, dur, { vol = 0.15, freq = 2000, q = 0.8 } = {}) {
    const c = this.ctx;
    if (!this.noiseBuf) {
      this.noiseBuf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(start);
    src.stop(start + dur + 0.02);
  }

  /** Each kind of decoration has its own little voice when picked up / set down. */
  itemSound(category, t, down) {
    const k = down ? 1 : 1.25;
    switch (CATEGORY_VOICE[category] || 'tok') {
      case 'jingle':
        this.bell(1568 * k, t, 0.25, 0.1, this.sfxBus);
        this.bell(2093 * k, t + 0.05, 0.25, 0.08, this.sfxBus);
        break;
      case 'tink':
        this.tone(1760 * k, t, 0.12, { vol: 0.12 });
        break;
      case 'twinkle':
        this.bell(2349 * k, t, 0.2, 0.08, this.sfxBus);
        this.bell(3136 * k, t + 0.07, 0.25, 0.06, this.sfxBus);
        break;
      case 'thunk':
        this.tone(140 * k, t, 0.16, { type: 'sine', vol: 0.4, slideTo: 80 });
        break;
      case 'squeak':
        this.tone(1300 * k, t, 0.08, { type: 'sine', vol: 0.12, slideTo: 1900 * k });
        break;
      case 'bloop':
        this.tone(320 * k, t, 0.14, { type: 'sine', vol: 0.25, slideTo: 640 * k });
        break;
      case 'rustle':
        this.noise(t, 0.12, { vol: 0.18, freq: 3500 });
        break;
      case 'whoosh':
        this.noise(t, 0.2, { vol: 0.12, freq: 900, q: 0.5 });
        break;
      case 'oooh':
        this.tone(420 * k, t, 0.3, { type: 'sine', vol: 0.12, slideTo: 300 * k, attack: 0.05 });
        break;
      default:
        this.tone(330 * k, t, 0.12, { type: 'triangle', vol: 0.3, slideTo: 260 * k });
    }
  }

  play(name, opt = {}) {
    if (!this.ctx || !this.save.sfx) return;
    const t = this.ctx.currentTime + 0.01;
    switch (name) {
      case 'pickItem':
        this.itemSound(opt.category, t, false);
        break;
      case 'placeItem':
        this.itemSound(opt.category, t, true);
        this.noise(t, 0.06, { vol: 0.06, freq: 600 });
        break;
      case 'settle': {
        // a spot just filled up: the more spots are full, the higher the chime
        const scale = [72, 74, 76, 79, 81, 84, 86];
        this.bell(midi(scale[Math.min(scale.length - 1, opt.n || 0)]), t, 0.6, 0.12, this.sfxBus);
        break;
      }
      case 'note': {
        const scale = [72, 76, 79, 84, 88, 91, 96];
        this.bell(midi(scale[Math.min(scale.length - 1, opt.i || 0)]), t, 0.9, 0.18, this.sfxBus);
        break;
      }
      case 'star':
        this.bell(midi(91), t, 0.5, 0.18, this.sfxBus);
        this.bell(midi(96), t + 0.06, 0.6, 0.12, this.sfxBus);
        break;
      case 'frozen':
        this.tone(2400, t, 0.05, { vol: 0.06 });
        this.tone(1800, t + 0.04, 0.08, { vol: 0.05 });
        break;
      case 'poof':
        this.noise(t, 0.35, { vol: 0.2, freq: 700, q: 0.4 });
        break;
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
      const song = this.song;
      const BEAT = 60 / song.bpm;
      const [chordName, melody] = song.bars[Math.floor(this.step / 3) % song.bars.length];
      const beat = this.step % 3;
      const chord = song.chords[chordName];
      const t = this.nextTime;
      if (beat === 0) {
        if (song.bass !== false) this.tone(midi(chord[0] - 12), t, BEAT * 2.5, { type: 'triangle', vol: 0.35, bus: this.musicBus, attack: 0.02 });
        else this.bell(midi(chord[0] + 12), t, BEAT * 1.5, 0.1, this.musicBus);
      } else this.bell(midi(chord[beat] + 12), t, BEAT * 1.2, 0.12, this.musicBus);
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
