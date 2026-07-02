import { cubicOut, cubicInOut } from 'svelte/easing';

/** True when the user asks for reduced motion (false during SSR). */
export function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * Enter-transition params per DESIGN.md: ease-out fly, 8px rise, ~240ms, 40ms
 * stagger by index. Reduced motion: a near-instant opacity fade - no
 * transform, no stagger.
 */
export function flyIn(index = 0, { y = 8, duration = 240 } = {}) {
	return prefersReducedMotion()
		? { y: 0, duration: 120, delay: 0, easing: cubicOut }
		: { y, duration, delay: index * 40, easing: cubicOut };
}

/**
 * Re-sort params per DESIGN.md: rows slide to their new position with an
 * ease-in-out layout transition. Reduced motion: instant.
 */
export function flipParams() {
	return prefersReducedMotion() ? { duration: 0 } : { duration: 300, easing: cubicInOut };
}
