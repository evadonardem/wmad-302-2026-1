import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useDesignMode } from '@/context/DesignModeContext';

const STYLE_ID = 'martfury-ambient-engine-style';
const LAYER_ID = 'martfury-ambient-engine-layer';

const AMBIENT_CSS = `
@keyframes mfSmokeFlow1 {
  0%   { transform: translate3d(-6%, -4%, 0) scale(1) rotate(-8deg); }
  50%  { transform: translate3d(8%, 6%, 0) scale(1.16) rotate(6deg); }
  100% { transform: translate3d(-6%, -4%, 0) scale(1) rotate(-8deg); }
}

@keyframes mfSmokeFlow2 {
  0%   { transform: translate3d(8%, 5%, 0) scale(1.06) rotate(10deg); }
  50%  { transform: translate3d(-8%, -6%, 0) scale(1.2) rotate(-6deg); }
  100% { transform: translate3d(8%, 5%, 0) scale(1.06) rotate(10deg); }
}

@keyframes mfPulseAura {
  0%, 100% { opacity: 0.45; transform: scale(0.96); }
  50%      { opacity: 0.95; transform: scale(1.12); }
}

@keyframes mfEmberFloat {
  0% {
    transform: translate3d(0, 0, 0) scale(0.7);
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  80% {
    opacity: 0.9;
  }
  100% {
    transform: translate3d(var(--drift, 28px), -105vh, 0) scale(1.3);
    opacity: 0;
  }
}

#${LAYER_ID} {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 9998;
}

#${LAYER_ID} .mf-smoke-1 {
  position: absolute;
  top: 4%;
  left: -8%;
  width: 65vw;
  height: 55vh;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(225, 29, 72, 0.34) 0%, rgba(190, 18, 60, 0.14) 45%, transparent 72%);
  filter: blur(44px);
  animation: mfSmokeFlow1 11s ease-in-out infinite;
}

#${LAYER_ID} .mf-smoke-2 {
  position: absolute;
  bottom: 4%;
  right: -8%;
  width: 68vw;
  height: 58vh;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 30, 66, 0.30) 0%, rgba(159, 18, 57, 0.12) 48%, transparent 74%);
  filter: blur(50px);
  animation: mfSmokeFlow2 14s ease-in-out infinite;
}

#${LAYER_ID} .mf-pulse {
  position: absolute;
  top: 18%;
  left: 20%;
  width: 60vw;
  height: 60vh;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(225, 29, 72, 0.24) 0%, transparent 70%);
  filter: blur(54px);
  animation: mfPulseAura 5.5s ease-in-out infinite;
}

#${LAYER_ID} .mf-ember {
  position: absolute;
  bottom: 58px;
  border-radius: 50%;
  background: #FF4D79;
  box-shadow: 0 0 14px 4px rgba(255, 30, 66, 0.95), 0 0 28px 8px rgba(225, 29, 72, 0.55);
  animation-name: mfEmberFloat;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

#${LAYER_ID}.is-glass .mf-smoke-1 {
  background: radial-gradient(circle, rgba(251, 191, 36, 0.26) 0%, transparent 70%);
}

#${LAYER_ID}.is-glass .mf-smoke-2 {
  background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%);
}

#${LAYER_ID}.is-glass .mf-pulse,
#${LAYER_ID}.is-glass .mf-ember {
  display: none;
}
`;

const EMBERS = [
  { left: '5%', size: 6, dur: '6.2s', delay: '0s', drift: '32px' },
  { left: '12%', size: 8, dur: '7.8s', delay: '0.9s', drift: '-26px' },
  { left: '19%', size: 5, dur: '5.6s', delay: '1.7s', drift: '24px' },
  { left: '27%', size: 7, dur: '7.1s', delay: '0.4s', drift: '-34px' },
  { left: '35%', size: 6, dur: '6.6s', delay: '2.2s', drift: '28px' },
  { left: '43%', size: 9, dur: '8.3s', delay: '0.2s', drift: '-30px' },
  { left: '51%', size: 5, dur: '5.9s', delay: '1.3s', drift: '36px' },
  { left: '59%', size: 8, dur: '7.5s', delay: '2.6s', drift: '-24px' },
  { left: '67%', size: 6, dur: '6.4s', delay: '0.8s', drift: '30px' },
  { left: '75%', size: 7, dur: '7.9s', delay: '1.9s', drift: '-32px' },
  { left: '83%', size: 5, dur: '5.8s', delay: '0.5s', drift: '22px' },
  { left: '90%', size: 8, dur: '7.2s', delay: '1.5s', drift: '-26px' },
  { left: '96%', size: 6, dur: '6.1s', delay: '0.3s', drift: '20px' },
];

export function CrimsonAmbientBackdrop() {
  const { isCrimson } = useDesignMode();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let styleTag = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = STYLE_ID;
      styleTag.textContent = AMBIENT_CSS;
      document.head.appendChild(styleTag);
    }

    let container = document.getElementById(LAYER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = LAYER_ID;

      const s1 = document.createElement('div');
      s1.className = 'mf-smoke-1';
      const s2 = document.createElement('div');
      s2.className = 'mf-smoke-2';
      const pulse = document.createElement('div');
      pulse.className = 'mf-pulse';

      container.appendChild(s1);
      container.appendChild(s2);
      container.appendChild(pulse);

      EMBERS.forEach((e) => {
        const dot = document.createElement('div');
        dot.className = 'mf-ember';
        dot.style.left = e.left;
        dot.style.width = `${e.size}px`;
        dot.style.height = `${e.size}px`;
        dot.style.animationDuration = e.dur;
        dot.style.animationDelay = e.delay;
        dot.style.setProperty('--drift', e.drift);
        container?.appendChild(dot);
      });

      document.body.appendChild(container);
    }

    container.className = isCrimson ? 'is-crimson' : 'is-glass';
  }, [isCrimson]);

  return null;
}
