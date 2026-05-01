/**
 * Bahis tikleri, uçuş start, patlama (gür burst + kompresör), kepenk aç (slide) / kapanış (inferno) — Web Audio.
 */

let sharedCtx: AudioContext | null = null;
let visibilityResumeAttached = false;

function attachVisibilityAudioResume() {
  if (visibilityResumeAttached || typeof document === "undefined") return;
  visibilityResumeAttached = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (sharedCtx?.state === "suspended") {
      void sharedCtx.resume().catch(() => {});
    }
  });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  attachVisibilityAudioResume();
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

function connectStereo(
  ac: AudioContext,
  node: AudioNode,
  pan: number,
  master: GainNode,
  when: number,
): StereoPannerNode {
  const p = ac.createStereoPanner();
  p.pan.setValueAtTime(pan, when);
  node.connect(p);
  p.connect(master);
  return p;
}

/** Son 3 sn — yayın / şov “kapılar” vuruşu: kalın, tok, modern; tek slapback, feedback yok. */
export function playBettingCountdownTick(): void {
  const ac = getAudioContext();
  if (!ac) return;

  const t0 = ac.currentTime;
  const dry = ac.createGain();
  dry.gain.value = 1;

  const slap = ac.createDelay(0.12);
  slap.delayTime.value = 0.046;

  const wet = ac.createGain();
  wet.gain.value = 0.085;

  const wetTone = ac.createBiquadFilter();
  wetTone.type = "lowpass";
  wetTone.frequency.value = 2200;
  wetTone.Q.value = 0.55;

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -21;
  comp.knee.value = 2.5;
  comp.ratio.value = 5;
  comp.attack.value = 0.001;
  comp.release.value = 0.125;

  dry.connect(comp);
  dry.connect(slap);
  slap.connect(wetTone);
  wetTone.connect(wet);
  wet.connect(comp);
  comp.connect(ac.destination);

  const when = t0;

  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(78, when);
  sub.frequency.exponentialRampToValueAtTime(46, when + 0.072);
  const subG = ac.createGain();
  subG.gain.setValueAtTime(0.0001, when);
  subG.gain.exponentialRampToValueAtTime(0.62, when + 0.0022);
  subG.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
  sub.connect(subG);

  const mid = ac.createOscillator();
  mid.type = "sine";
  mid.frequency.setValueAtTime(248, when);
  mid.frequency.exponentialRampToValueAtTime(118, when + 0.032);
  const midG = ac.createGain();
  midG.gain.setValueAtTime(0.0001, when);
  midG.gain.exponentialRampToValueAtTime(0.24, when + 0.0016);
  midG.gain.exponentialRampToValueAtTime(0.0001, when + 0.078);
  mid.connect(midG);

  const top = ac.createOscillator();
  top.type = "triangle";
  top.frequency.setValueAtTime(1420, when);
  top.frequency.exponentialRampToValueAtTime(620, when + 0.022);
  const topF = ac.createBiquadFilter();
  topF.type = "highpass";
  topF.frequency.setValueAtTime(450, when);
  const topG = ac.createGain();
  topG.gain.setValueAtTime(0.0001, when);
  topG.gain.exponentialRampToValueAtTime(0.07, when + 0.001);
  topG.gain.exponentialRampToValueAtTime(0.0001, when + 0.038);
  top.connect(topF);
  topF.connect(topG);

  const clickLen = Math.floor(ac.sampleRate * 0.014);
  const cBuf = ac.createBuffer(1, clickLen, ac.sampleRate);
  const cCh = cBuf.getChannelData(0);
  for (let i = 0; i < cCh.length; i++) {
    cCh[i] = (Math.random() * 2 - 1) * (1 - i / clickLen);
  }
  const cSrc = ac.createBufferSource();
  cSrc.buffer = cBuf;
  const cBp = ac.createBiquadFilter();
  cBp.type = "bandpass";
  cBp.frequency.setValueAtTime(3200, when);
  cBp.Q.setValueAtTime(1.1, when);
  const cG = ac.createGain();
  cG.gain.setValueAtTime(0.0001, when);
  cG.gain.exponentialRampToValueAtTime(0.11, when + 0.0006);
  cG.gain.exponentialRampToValueAtTime(0.0001, when + 0.018);
  cSrc.connect(cBp);
  cBp.connect(cG);

  subG.connect(dry);
  midG.connect(dry);
  topG.connect(dry);
  cG.connect(dry);

  sub.start(when);
  mid.start(when);
  top.start(when);
  cSrc.start(when);
  sub.stop(when + 0.24);
  mid.stop(when + 0.1);
  top.stop(when + 0.055);
  cSrc.stop(when + 0.022);
}

/** Bahis bitti — uçuş start: gür, modern “lift + yaylı” stinger. */
export function playFlightStartStinger(): void {
  const ac = getAudioContext();
  if (!ac) return;

  const t0 = ac.currentTime;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.78, t0 + 0.02);
  master.gain.exponentialRampToValueAtTime(0.52, t0 + 0.12);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.62);
  master.connect(ac.destination);

  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(88, t0);
  sub.frequency.exponentialRampToValueAtTime(48, t0 + 0.28);
  const subG = ac.createGain();
  subG.gain.setValueAtTime(0.0001, t0);
  subG.gain.exponentialRampToValueAtTime(0.52, t0 + 0.035);
  subG.gain.exponentialRampToValueAtTime(0.12, t0 + 0.22);
  subG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.48);
  sub.connect(subG);
  subG.connect(master);

  const freqs = [
    { start: 360, end: 523.25, pan: -0.35, g: 0.13 },
    { start: 480, end: 659.25, pan: 0, g: 0.15 },
    { start: 600, end: 880, pan: 0.35, g: 0.11 },
  ] as const;

  for (const { start, end, pan, g } of freqs) {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(start * 0.55, t0);
    o.frequency.exponentialRampToValueAtTime(end, t0 + 0.2);
    const gN = ac.createGain();
    gN.gain.setValueAtTime(0.0001, t0);
    gN.gain.exponentialRampToValueAtTime(g, t0 + 0.04);
    gN.gain.exponentialRampToValueAtTime(g * 0.55, t0 + 0.25);
    gN.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.52);
    o.connect(gN);
    connectStereo(ac, gN, pan, master, t0);
    o.start(t0);
    o.stop(t0 + 0.54);
  }

  const fifth = ac.createOscillator();
  fifth.type = "triangle";
  fifth.frequency.setValueAtTime(1760, t0);
  fifth.frequency.exponentialRampToValueAtTime(2640, t0 + 0.16);
  const fifthG = ac.createGain();
  fifthG.gain.setValueAtTime(0.0001, t0);
  fifthG.gain.exponentialRampToValueAtTime(0.065, t0 + 0.05);
  fifthG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35);
  fifth.connect(fifthG);
  connectStereo(ac, fifthG, 0.12, master, t0);
  fifth.start(t0);
  fifth.stop(t0 + 0.38);

  const bufLen = ac.sampleRate * 0.14;
  const whoosh = ac.createBuffer(1, bufLen, ac.sampleRate);
  const wch = whoosh.getChannelData(0);
  for (let i = 0; i < wch.length; i++) {
    wch[i] = (Math.random() * 2 - 1) * (1 - i / wch.length) * 0.5;
  }
  const wSrc = ac.createBufferSource();
  wSrc.buffer = whoosh;
  const wBp = ac.createBiquadFilter();
  wBp.type = "bandpass";
  wBp.frequency.setValueAtTime(400, t0);
  wBp.frequency.exponentialRampToValueAtTime(6200, t0 + 0.11);
  wBp.Q.setValueAtTime(0.45, t0);
  const wG = ac.createGain();
  wG.gain.setValueAtTime(0.0001, t0);
  wG.gain.exponentialRampToValueAtTime(0.22, t0 + 0.04);
  wG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
  wSrc.connect(wBp);
  wBp.connect(wG);
  connectStereo(ac, wG, -0.08, master, t0);
  wSrc.start(t0);
  wSrc.stop(t0 + 0.2);

  sub.start(t0);
  sub.stop(t0 + 0.52);
}

/** Kepenk açılırken — yumuşak sürtünme / süzülme. */
export function playShutterSlide(): void {
  const ac = getAudioContext();
  if (!ac) return;

  const t0 = ac.currentTime;
  const dur = 0.84;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.52, t0 + 0.1);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.05);
  master.connect(ac.destination);

  const nLen = Math.floor(ac.sampleRate * (dur + 0.06));
  const buf = ac.createBuffer(1, nLen, ac.sampleRate);
  const ch = buf.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < ch.length; i++) {
    brown = 0.993 * brown + (Math.random() * 2 - 1) * 0.16;
    const fade = 1 - Math.min(1, i / (nLen * 0.95));
    ch[i] = brown * (0.42 + 0.58 * fade * fade);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1650, t0);
  bp.frequency.exponentialRampToValueAtTime(280, t0 + dur * 0.94);
  bp.Q.setValueAtTime(0.58, t0);
  const nG = ac.createGain();
  nG.gain.setValueAtTime(0.0001, t0);
  nG.gain.exponentialRampToValueAtTime(0.19, t0 + 0.14);
  nG.gain.exponentialRampToValueAtTime(0.055, t0 + dur * 0.72);
  nG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp);
  bp.connect(nG);
  nG.connect(master);

  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(58, t0);
  sub.frequency.exponentialRampToValueAtTime(34, t0 + dur * 0.98);
  const subG = ac.createGain();
  subG.gain.setValueAtTime(0.0001, t0);
  subG.gain.exponentialRampToValueAtTime(0.11, t0 + 0.18);
  subG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  sub.connect(subG);
  subG.connect(master);

  const rub = ac.createOscillator();
  rub.type = "triangle";
  rub.frequency.setValueAtTime(190, t0);
  rub.frequency.exponentialRampToValueAtTime(95, t0 + dur);
  const rubG = ac.createGain();
  rubG.gain.setValueAtTime(0.0001, t0);
  rubG.gain.exponentialRampToValueAtTime(0.045, t0 + 0.06);
  rubG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.88);
  rub.connect(rubG);
  connectStereo(ac, rubG, 0.18, master, t0);

  src.start(t0);
  sub.start(t0);
  rub.start(t0);
  src.stop(t0 + dur + 0.02);
  sub.stop(t0 + dur + 0.02);
  rub.stop(t0 + dur);
}

/**
 * Kepenk kapanırken — kızgın / boğuk / uygunsuz (cehennem hissi).
 * Açılış sesinden bilinçli olarak tamamen ayrı patch.
 */
export function playShutterCloseInferno(): void {
  const ac = getAudioContext();
  if (!ac) return;

  const t0 = ac.currentTime;
  const dur = 1.08;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t0);
  master.gain.exponentialRampToValueAtTime(0.92, t0 + 0.045);
  master.gain.exponentialRampToValueAtTime(0.48, t0 + dur * 0.52);
  master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.14);

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -17;
  comp.knee.value = 5;
  comp.ratio.value = 5.5;
  comp.attack.value = 0.001;
  comp.release.value = 0.38;
  master.connect(comp);
  comp.connect(ac.destination);

  const nLen = Math.floor(ac.sampleRate * (dur + 0.1));
  const buf = ac.createBuffer(1, nLen, ac.sampleRate);
  const ch = buf.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < ch.length; i++) {
    brown = 0.988 * brown + (Math.random() * 2 - 1) * 0.24;
    const t = i / nLen;
    const gate = 0.55 + 0.45 * Math.sin(t * 38 * Math.PI) * Math.sin(t * 7 * Math.PI);
    ch[i] = brown * (0.55 + 0.45 * (1 - t) * (1 - t)) * (0.65 + 0.35 * Math.abs(gate));
  }
  const nSrc = ac.createBufferSource();
  nSrc.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(680, t0);
  bp.frequency.exponentialRampToValueAtTime(95, t0 + dur * 0.96);
  bp.Q.setValueAtTime(2.8, t0);
  const nG = ac.createGain();
  nG.gain.setValueAtTime(0.0001, t0);
  nG.gain.exponentialRampToValueAtTime(0.26, t0 + 0.08);
  nG.gain.exponentialRampToValueAtTime(0.11, t0 + dur * 0.62);
  nG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  nSrc.connect(bp);
  bp.connect(nG);
  nG.connect(master);
  nSrc.start(t0);
  nSrc.stop(t0 + dur + 0.05);

  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(52, t0);
  sub.frequency.exponentialRampToValueAtTime(19, t0 + dur * 0.99);
  const subG = ac.createGain();
  subG.gain.setValueAtTime(0.0001, t0);
  subG.gain.exponentialRampToValueAtTime(0.58, t0 + 0.07);
  subG.gain.exponentialRampToValueAtTime(0.22, t0 + dur * 0.45);
  subG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  sub.connect(subG);
  subG.connect(master);
  sub.start(t0);
  sub.stop(t0 + dur + 0.02);

  const hellPair: [number, number, number][] = [
    [188, -0.55, 0.63],
    [203, 0.52, 0.6],
  ];
  for (const [f0, pan, pk] of hellPair) {
    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.48, t0 + dur * 0.92);
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(720, t0);
    lp.frequency.exponentialRampToValueAtTime(110, t0 + dur * 0.88);
    lp.Q.setValueAtTime(3.2, t0);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pk * 0.085, t0 + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.95);
    o.connect(lp);
    lp.connect(g);
    connectStereo(ac, g, pan, master, t0);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  const moan = ac.createOscillator();
  moan.type = "triangle";
  moan.frequency.setValueAtTime(290, t0);
  moan.frequency.exponentialRampToValueAtTime(72, t0 + dur * 0.78);
  const mLp = ac.createBiquadFilter();
  mLp.type = "lowpass";
  mLp.frequency.setValueAtTime(420, t0);
  mLp.frequency.exponentialRampToValueAtTime(95, t0 + dur);
  mLp.Q.setValueAtTime(4.5, t0 + 0.08);
  const mG = ac.createGain();
  mG.gain.setValueAtTime(0.0001, t0);
  mG.gain.exponentialRampToValueAtTime(0.14, t0 + 0.05);
  mG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.94);
  moan.connect(mLp);
  mLp.connect(mG);
  connectStereo(ac, mG, -0.12, master, t0);
  moan.start(t0);
  moan.stop(t0 + dur + 0.02);

  const crackLen = Math.floor(ac.sampleRate * 0.09);
  const cBuf = ac.createBuffer(1, crackLen, ac.sampleRate);
  const cCh = cBuf.getChannelData(0);
  for (let i = 0; i < cCh.length; i++) {
    cCh[i] = (Math.random() * 2 - 1) * (1 - i / crackLen);
  }
  const cSrc = ac.createBufferSource();
  cSrc.buffer = cBuf;
  const cHp = ac.createBiquadFilter();
  cHp.type = "highpass";
  cHp.frequency.setValueAtTime(1800, t0);
  cHp.Q.setValueAtTime(0.6, t0);
  const cG = ac.createGain();
  cG.gain.setValueAtTime(0.0001, t0);
  cG.gain.exponentialRampToValueAtTime(0.12, t0 + 0.004);
  cG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.085);
  cSrc.connect(cHp);
  cHp.connect(cG);
  connectStereo(ac, cG, 0.35, master, t0);
  cSrc.start(t0);
  cSrc.stop(t0 + 0.095);
}

/** Patlama / kayıp — gür, gövdeli, hafif master kompresyon. */
export function playRoundCrashBurst(): void {
  const ac = getAudioContext();
  if (!ac) return;

  const t0 = ac.currentTime;
  const master = ac.createGain();
  master.gain.setValueAtTime(0.00008, t0);
  master.gain.exponentialRampToValueAtTime(0.98, t0 + 0.01);
  master.gain.setValueAtTime(0.86, t0 + 0.055);
  master.gain.exponentialRampToValueAtTime(0.00008, t0 + 0.92);

  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 16;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.0015;
  comp.release.value = 0.2;
  master.connect(comp);
  comp.connect(ac.destination);

  const sub = ac.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(62, t0);
  sub.frequency.exponentialRampToValueAtTime(36, t0 + 0.16);
  const subG = ac.createGain();
  subG.gain.setValueAtTime(0.00008, t0);
  subG.gain.exponentialRampToValueAtTime(0.68, t0 + 0.022);
  subG.gain.exponentialRampToValueAtTime(0.22, t0 + 0.1);
  subG.gain.exponentialRampToValueAtTime(0.00008, t0 + 0.26);
  sub.connect(subG);
  subG.connect(master);
  sub.start(t0);
  sub.stop(t0 + 0.28);

  const nLen = Math.floor(ac.sampleRate * 0.072);
  const nBuf = ac.createBuffer(1, nLen, ac.sampleRate);
  const nCh = nBuf.getChannelData(0);
  for (let i = 0; i < nCh.length; i++) {
    nCh[i] = (Math.random() * 2 - 1) * (1 - i / nCh.length) * 0.95;
  }
  const nSrc = ac.createBufferSource();
  nSrc.buffer = nBuf;
  const nBp = ac.createBiquadFilter();
  nBp.type = "bandpass";
  nBp.frequency.setValueAtTime(420, t0);
  nBp.frequency.exponentialRampToValueAtTime(2400, t0 + 0.048);
  nBp.Q.setValueAtTime(0.75, t0);
  const nG = ac.createGain();
  nG.gain.setValueAtTime(0.00008, t0);
  nG.gain.exponentialRampToValueAtTime(0.11, t0 + 0.004);
  nG.gain.exponentialRampToValueAtTime(0.00008, t0 + 0.068);
  nSrc.connect(nBp);
  nBp.connect(nG);
  connectStereo(ac, nG, -0.32, master, t0);
  nSrc.start(t0);
  nSrc.stop(t0 + 0.075);

  const blip = (
    when: number,
    freq: number,
    len: number,
    peak: number,
    pan: number,
  ) => {
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, when);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.00008, when);
    g.gain.exponentialRampToValueAtTime(peak, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.00008, when + len);
    o.connect(g);
    connectStereo(ac, g, pan, master, when);
    o.start(when);
    o.stop(when + len + 0.025);

    const o2 = ac.createOscillator();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(freq * 0.5, when);
    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.00008, when);
    g2.gain.exponentialRampToValueAtTime(peak * 0.14, when + 0.006);
    g2.gain.exponentialRampToValueAtTime(0.00008, when + len * 0.92);
    o2.connect(g2);
    connectStereo(ac, g2, pan * 0.6, master, when);
    o2.start(when);
    o2.stop(when + len + 0.02);
  };

  blip(t0 + 0.002, 800, 0.095, 0.55, -0.28);
  blip(t0 + 0.105, 620, 0.084, 0.5, 0.3);

  const tLong = t0 + 0.19;
  const moan = ac.createOscillator();
  moan.type = "sine";
  moan.frequency.setValueAtTime(495, tLong);
  moan.frequency.exponentialRampToValueAtTime(195, tLong + 0.14);
  moan.frequency.exponentialRampToValueAtTime(88, tLong + 0.42);

  const mG = ac.createGain();
  mG.gain.setValueAtTime(0.00008, tLong);
  mG.gain.exponentialRampToValueAtTime(0.62, tLong + 0.028);
  mG.gain.exponentialRampToValueAtTime(0.28, tLong + 0.24);
  mG.gain.exponentialRampToValueAtTime(0.00008, tLong + 0.52);
  moan.connect(mG);
  connectStereo(ac, mG, -0.08, master, tLong);

  const warm = ac.createOscillator();
  warm.type = "triangle";
  warm.frequency.setValueAtTime(275, tLong);
  warm.frequency.exponentialRampToValueAtTime(108, tLong + 0.4);
  const wG = ac.createGain();
  wG.gain.setValueAtTime(0.00008, tLong);
  wG.gain.exponentialRampToValueAtTime(0.16, tLong + 0.038);
  wG.gain.exponentialRampToValueAtTime(0.00008, tLong + 0.46);
  warm.connect(wG);
  connectStereo(ac, wG, 0.22, master, tLong);

  const air = ac.createOscillator();
  air.type = "sine";
  air.frequency.setValueAtTime(1280, tLong);
  air.frequency.exponentialRampToValueAtTime(520, tLong + 0.35);
  const airG = ac.createGain();
  airG.gain.setValueAtTime(0.00008, tLong);
  airG.gain.exponentialRampToValueAtTime(0.055, tLong + 0.05);
  airG.gain.exponentialRampToValueAtTime(0.00008, tLong + 0.4);
  air.connect(airG);
  connectStereo(ac, airG, 0.45, master, tLong);

  moan.start(tLong);
  warm.start(tLong);
  air.start(tLong);
  moan.stop(tLong + 0.56);
  warm.stop(tLong + 0.5);
  air.stop(tLong + 0.44);

  const snap = ac.createOscillator();
  snap.type = "sine";
  snap.frequency.setValueAtTime(1350, tLong);
  snap.frequency.exponentialRampToValueAtTime(280, tLong + 0.06);
  const sF = ac.createBiquadFilter();
  sF.type = "bandpass";
  sF.frequency.setValueAtTime(980, tLong);
  sF.Q.setValueAtTime(2.4, tLong);
  const sG = ac.createGain();
  sG.gain.setValueAtTime(0.00008, tLong);
  sG.gain.exponentialRampToValueAtTime(0.13, tLong + 0.0025);
  sG.gain.exponentialRampToValueAtTime(0.00008, tLong + 0.072);
  snap.connect(sF);
  sF.connect(sG);
  connectStereo(ac, sG, 0.18, master, tLong);
  snap.start(tLong);
  snap.stop(tLong + 0.088);
}
