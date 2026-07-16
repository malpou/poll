/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Prefunavailable1Inputs */

const da_prefunavailable1 = /** @type {(inputs: Prefunavailable1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kan ikke`)
};

const en_prefunavailable1 = /** @type {(inputs: Prefunavailable1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Can't make it`)
};

const fr_prefunavailable1 = /** @type {(inputs: Prefunavailable1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Indisponible`)
};

/**
* | output |
* | --- |
* | "Can't make it" |
*
* @param {Prefunavailable1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const prefunavailable1 = /** @type {((inputs?: Prefunavailable1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Prefunavailable1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_prefunavailable1(inputs)
	if (locale === "en") return en_prefunavailable1(inputs)
	return fr_prefunavailable1(inputs)
});
export { prefunavailable1 as "prefUnavailable" }