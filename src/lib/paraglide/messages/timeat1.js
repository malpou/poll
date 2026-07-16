/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Timeat1Inputs */

const da_timeat1 = /** @type {(inputs: Timeat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`kl. `)
};

const en_timeat1 = /** @type {(inputs: Timeat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`at `)
};

const fr_timeat1 = /** @type {(inputs: Timeat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`à `)
};

/**
* | output |
* | --- |
* | "at" |
*
* @param {Timeat1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const timeat1 = /** @type {((inputs?: Timeat1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Timeat1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_timeat1(inputs)
	if (locale === "en") return en_timeat1(inputs)
	return fr_timeat1(inputs)
});
export { timeat1 as "timeAt" }