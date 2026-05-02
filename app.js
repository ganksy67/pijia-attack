const phrases = [
  '皮夹哈尔什哈赛利克',
  '皮夹缓慢侠',
  '皮夹 slowdown man',
  '皮夹哈族',
  '皮夹',
  'P夹',
];

const rain = document.getElementById('rain');
const startBtn = document.getElementById('startBtn');
const muteBtn = document.getElementById('muteBtn');
const statusEl = document.getElementById('status');
let running = false;
let muted = false;
let rainTimer = null;
let voiceTimer = null;
let audioCtx = null;
let audioNudgeTimer = null;
let beepTimer = null;
let vibrateTimer = null;

function rand(min, max){ return Math.random() * (max - min) + min; }

function makeDrop(){
  const el = document.createElement('div');
  el.className = 'drop';
  const text = phrases[Math.floor(Math.random() * phrases.length)];
  el.textContent = text + '  ·  ' + text;
  const leftToRight = Math.random() > 0.5;
  el.style.setProperty('--from', leftToRight ? '-130vw' : '130vw');
  el.style.setProperty('--to', leftToRight ? '130vw' : '-130vw');
  el.style.setProperty('--y', rand(4, 94) + 'vh');
  el.style.setProperty('--rot', rand(-7, 7) + 'deg');
  el.style.setProperty('--rotEnd', rand(-7, 7) + 'deg');
  el.style.setProperty('--s', rand(.75, 1.45));
  el.style.fontSize = rand(22, 52) + 'px';
  el.style.animationDuration = rand(11, 19) + 's';
  el.style.color = ['#fff','#ff2bd6','#21f6ff','#fff13b','#39ff14'][Math.floor(rand(0,5))];
  rain.appendChild(el);
  setTimeout(() => el.remove(), 20000);
}

function startRain(){
  if(rainTimer) return;
  for(let i=0;i<22;i++) setTimeout(makeDrop, i*260);
  rainTimer = setInterval(() => {
    for(let i=0;i<2;i++) makeDrop();
  }, 900);
}

function stopRain(){
  clearInterval(rainTimer); rainTimer = null;
}

function chooseChineseVoice(){
  const voices = speechSynthesis.getVoices();
  return voices.find(v => /zh|Chinese|Ting|Mei|Sin|普通话|中文/i.test(v.lang + v.name)) || voices[0] || null;
}

function speakOnce(){
  if(!running || muted) return;
  clearTimeout(voiceTimer);
  speechSynthesis.cancel();
  const text = phrases.join('，') + '，' + phrases.slice().reverse().join('，');
  const u = new SpeechSynthesisUtterance(text);
  const voice = chooseChineseVoice();
  if(voice) u.voice = voice;
  u.lang = 'zh-CN';
  u.rate = 1.12;
  u.pitch = 1.65;
  u.volume = 1;
  u.onstart = () => {
    statusEl.textContent = '语音已开始：皮夹循环中。';
  };
  u.onend = () => {
    if(running && !muted) voiceTimer = setTimeout(speakOnce, 240);
  };
  u.onerror = () => {
    if(running && !muted) voiceTimer = setTimeout(speakOnce, 900);
  };
  try { speechSynthesis.speak(u); } catch(e) {}
}

function beepAttack(){
  // 轻微电子脉冲，不做刺耳高音，避免真伤耳朵
  if(!running || muted) return;
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(rand(120, 260), now);
  osc.frequency.exponentialRampToValueAtTime(rand(260, 520), now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now); osc.stop(now + 0.15);
}

function startAttack(auto = false){
  if(running) return;
  running = true; muted = false;
  document.body.classList.add('active');
  startBtn.textContent = auto ? '已自动尝试开喷' : '精神攻击已启动';
  startBtn.classList.add('started');
  muteBtn.hidden = false;
  statusEl.textContent = auto
    ? '正在自动尝试语音播放；如果被浏览器拦截，碰一下屏幕立刻续上。'
    : '正在循环：皮夹哈尔什哈赛利克 / 皮夹缓慢侠 / 皮夹 slowdownman / 皮夹哈族 / 皮夹';
  startRain();
  speechSynthesis.onvoiceschanged = speakOnce;
  tryStartAudioRepeatedly();
  if(!beepTimer) beepTimer = setInterval(beepAttack, 900);
  if(navigator.vibrate && !vibrateTimer) vibrateTimer = setInterval(() => { if(running && !muted) navigator.vibrate([35,30,35]); }, 1300);
}

function tryStartAudioRepeatedly(){
  if(audioNudgeTimer) clearInterval(audioNudgeTimer);
  let tries = 0;
  const nudge = () => {
    if(!running || muted) return;
    tries += 1;
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    speakOnce();
    beepAttack();
    if(tries >= 10) clearInterval(audioNudgeTimer);
  };
  nudge();
  audioNudgeTimer = setInterval(nudge, 1200);
}

function forceAudioAfterGesture(){
  if(!running) startAttack(false);
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
  muted = false;
  speechSynthesis.cancel();
  speakOnce();
  beepAttack();
  statusEl.textContent = '语音已接管：皮夹循环开始。';
}

startBtn.addEventListener('click', forceAudioAfterGesture);
document.addEventListener('pointerdown', forceAudioAfterGesture, { once: true });
document.addEventListener('touchstart', forceAudioAfterGesture, { once: true });
document.addEventListener('keydown', forceAudioAfterGesture, { once: true });
muteBtn.addEventListener('click', () => {
  muted = !muted;
  if(muted){
    speechSynthesis.cancel();
    statusEl.textContent = '已闭嘴，但视觉攻击还在。';
    muteBtn.textContent = '继续开喷';
  }else{
    statusEl.textContent = '语音继续循环。';
    muteBtn.textContent = '闭嘴 / 继续';
    speakOnce();
  }
});

// 视觉攻击进页面就启动，语音会连续尝试自动播放；若被浏览器拦截，点页面任意位置续上
startRain();
window.addEventListener('load', () => {
  setTimeout(() => startAttack(true), 120);
  setTimeout(() => { if(running && !muted) tryStartAudioRepeatedly(); }, 1200);
  setTimeout(() => { if(running && !muted) tryStartAudioRepeatedly(); }, 3600);
});
document.addEventListener('visibilitychange', () => {
  if(!document.hidden && running && !muted) tryStartAudioRepeatedly();
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
