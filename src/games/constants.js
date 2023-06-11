const aspect = 640/480;
export const videoHeight = window.innerHeight-30;
export const videoWidth = videoHeight*aspect;

export const TIMEOUT_FRAMES = 80;
export const NOOB = 1;
export const TOUCHED = 2;
export const BINNED = 3;

const ua = navigator.userAgent;
let device = "";
if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
  device = "mobile";
} else {
  device = "desktop";
}

export const RESETTING_FRAMES = device === "mobile" ? 5 : 20;

export const BINSOUND ='./win.mp3';
export const WRONGBINSOUND ='./buzzer.mp3';
export const DROPPEDSOUND ='./glass_crash_sound.mp3';
export const FINALFANFARE = './fanfare.mp3';
export const voiceParams = {rate: 0.85, lang: 'Google US English'};

export const CALIBRATION = 1;
export const GAMEPLAY = 2;

export const ROLE_BIN = 'Bin';
export const ROLE_TARGET = 'Target';
export const ROLE_MIDPOINT = 'Midpoint';
export const TARGETSIZE = videoHeight*80/480;
export const HANDSIZE = videoHeight*12/480;
export const IMGSIZE = videoHeight*150/480;

export const gameList = [
  'Color Picking',
  'Shape Picking',
  'Simple Shadow Picking',
  'Advanced Shadow Picking',
  'Same Picking',
  'Visual Perception',
  'Eye Contact'
];

export const noAccountPages = ['/', '/register', '/feedback', '/reset', '/eye-contact'];
