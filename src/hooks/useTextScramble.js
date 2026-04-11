import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&';

export function useTextScramble(options = {}) {
  const ref = useRef(null);
  const { trigger = 'scroll', duration = 0.8, stagger = 0.02 } = options;

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !ref.current) return;

    const el = ref.current;
    const originalText = el.textContent;
    const chars = originalText.split('');
    const intervalIds = [];
    const timeoutIds = [];

    // Build spans using DOM API to avoid innerHTML XSS
    el.textContent = '';
    chars.forEach((c) => {
      if (c === ' ') {
        el.appendChild(document.createTextNode(' '));
      } else {
        const span = document.createElement('span');
        span.className = 'scramble-char';
        span.textContent = c;
        el.appendChild(span);
      }
    });

    const spans = el.querySelectorAll('.scramble-char');

    const animate = () => {
      spans.forEach((span, i) => {
        const target = chars[i];
        let iterations = 0;
        const maxIterations = 4 + Math.random() * 4;

        const interval = setInterval(() => {
          if (iterations >= maxIterations) {
            span.textContent = target;
            clearInterval(interval);
            return;
          }
          span.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          iterations++;
        }, 40 + i * (stagger * 1000));
        intervalIds.push(interval);

        const timeout = setTimeout(() => {
          clearInterval(interval);
          span.textContent = target;
        }, duration * 1000);
        timeoutIds.push(timeout);
      });
    };

    if (trigger === 'scroll') {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: animate,
      });
    } else if (trigger === 'mount') {
      animate();
    }

    return () => {
      intervalIds.forEach(id => clearInterval(id));
      timeoutIds.forEach(id => clearTimeout(id));
      el.textContent = originalText;
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [trigger, duration, stagger]);

  return ref;
}
