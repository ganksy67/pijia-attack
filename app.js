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

function rand(min, max){ return Math.random() * (max - min) + min; }

function makeDrop(){
  const el = document.createElement('div');
  el.className = 'drop';
  el.textContent = phrases[Math.floor(Math.random() * phrases.length)];
  el.style.setProperty('--x', rand(-8, 98) + 'vw');
  el.style.setProperty('--drift', rand(-30, 30) + 'vw');
  el.style.setProperty('--s', rand(.65, 1.9));
  el.style.left = '0';
  el.style.top = '0';
  el.style.fontSize = rand(18, 58) + 'px';
  el.style.animationDuration = rand(2.1, 5.3) + 's';
  el.style.color = ['#fff','#ff2bd6','#21f6ff','#fff13b','#39ff14'][Math.floor(rand(0,5))];
  rain.appendChild(el);
  setTimeout(() => el.remove(), 5600);
}

function startRain(){
  if(rainTimer) return;
  for(let i=0;i<60;i++) setTimeout(makeDrop, i*25);
  rainTimer = setInterval(() => {
    for(let i=0;i<5;i++) makeDrop();
  }, 120);
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
  speechSynthesis.cancel();
  const text = phrases.join('，') + '，' + phrases.slice().reverse().join('，');
  const u = new SpeechSynthesisUtterance(text);
  const voice = chooseChineseVoice();
  if(voice) u.voice = voice;
  u.lang = 'zh-CN';
  u.rate = 1.35;
  u.pitch = 1.75;
  u.volume = 1;
  u.onend = () => {
    if(running && !muted) voiceTimer = setTimeout(speakOnce, 120);
  };
  speechSynthesis.speak(u);
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
  startBtn.textContent = auto ? '已自动启动精神攻击' : '精神攻击已启动';
  startBtn.classList.add('started');
  muteBtn.hidden = false;
  statusEl.textContent = auto
    ? '已尝试自动播放语音；如果浏览器拦声音，点页面任意位置会立刻续上。'
    : '正在循环：皮夹哈尔什哈赛利克 / 皮夹缓慢侠 / 皮夹 slowdownman / 皮夹哈族 / 皮夹';
  startRain();
  speechSynthesis.onvoiceschanged = speakOnce;
  speakOnce();
  setInterval(beepAttack, 460);
  if(navigator.vibrate) setInterval(() => { if(running && !muted) navigator.vibrate([40,30,40]); }, 900);
}

function forceAudioAfterGesture(){
  if(!running) startAttack(false);
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
  muted = false;
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

// 视觉攻击进页面就启动，语音也立刻尝试播放；若被浏览器拦截，点页面任意位置续上
startRain();
window.addEventListener('load', () => {
  setTimeout(() => startAttack(true), 180);
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}
