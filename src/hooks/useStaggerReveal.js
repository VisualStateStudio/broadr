import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useStaggerReveal(selector, options = {}) {
  const containerRef = useRef(null);
  const {
    y = 20,
    opacity = 0,
    duration = 0.4,
    stagger = 0.06,
    ease = 'power2.out',
    start = 'top 85%',
  } = options;

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = containerRef.current;
    if (prefersReduced || !el) return;

    const children = el.querySelectorAll(selector);
    if (!children.length) return;

    gsap.fromTo(children,
      { y, opacity },
      {
        y: 0,
        opacity: 1,
        duration,
        stagger,
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
  }, [selector, y, opacity, duration, stagger, ease, start]);

  return containerRef;
}
