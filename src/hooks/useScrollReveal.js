import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const {
    y = 20,
    opacity = 0,
    duration = 0.5,
    delay = 0,
    ease = 'power2.out',
    start = 'top 85%',
  } = options;

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = ref.current;
    if (prefersReduced || !el) return;

    gsap.fromTo(el,
      { y, opacity },
      {
        y: 0,
        opacity: 1,
        duration,
        delay,
        ease,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [y, opacity, duration, delay, ease, start]);

  return ref;
}
