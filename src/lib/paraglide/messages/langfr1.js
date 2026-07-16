/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Langfr1Inputs */

const da_langfr1 = /** @type {(inputs: Langfr1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fransk`)
};

const en_langfr1 = /** @type {(inputs: Langfr1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`French`)
};

const fr_langfr1 = /** @type {(inputs: Langfr1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Français`)
};

/**
* | output |
* | --- |
* | "French" |
*
* @param {Langfr1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const langfr1 = /** @type {((inputs?: Langfr1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Langfr1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_langfr1(inputs)
	if (locale === "en") return en_langfr1(inputs)
	return fr_langfr1(inputs)
});
export { langfr1 as "langFr" }