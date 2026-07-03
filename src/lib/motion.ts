import { cubicOut, cubicInOut } from 'svelte/easing';

/** True when the user asks for reduced motion (false during SSR). */
export function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * Enter-transition params per DESIGN.md: ease-out fly, 8px rise, ~240ms, 35ms
 * stagger by index. Reduced motion: a near-instant opacity fade - no
 * transform, no stagger.
 */
export function flyIn(index = 0, { y = 8, duration = 240 } = {}) {
	return prefersReducedMotion()
		? { y: 0, duration: 120, delay: 0, easing: cubicOut }
		: { y, duration, delay: index * 35, easing: cubicOut };
}

/**
 * In-place state swap per DESIGN.md: content replaced where it stands (locale
 * re-render, hint text) fades in with a slight rise, ~180ms ease-out. Pass
 * y: 0 for an opacity-only swap. Reduced motion: near-instant fade, no rise.
 */
export function swapIn({ y = 4, duration = 180 } = {}) {
	return prefersReducedMotion()
		? { y: 0, duration: 90, easing: cubicOut }
		: { y, duration, easing: cubicOut };
}

/**
 * Disclosure open/close per DESIGN.md: a short ease-out slide. Reduced
 * motion: instant.
 */
export function slideParams() {
	return prefersReducedMotion() ? { duration: 0 } : { duration: 180, easing: cubicOut };
}

/**
 * Selector-indicator glide per DESIGN.md: ~350ms with a soft overshoot, never
 * a cut. Callers combine with prefersReducedMotion() to drop it.
 */
export const GLIDE = 'transform 350ms cubic-bezier(0.3, 1.25, 0.5, 1)';

/**
 * Re-sort params per DESIGN.md: rows slide to their new position with an
 * ease-in-out layout transition. Reduced motion: instant.
 */
export function flipParams() {
	return prefersReducedMotion() ? { duration: 0 } : { duration: 300, easing: cubicInOut };
}
