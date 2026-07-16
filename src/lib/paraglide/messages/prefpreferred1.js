/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Prefpreferred1Inputs */

const da_prefpreferred1 = /** @type {(inputs: Prefpreferred1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Foretrukket`)
};

const en_prefpreferred1 = /** @type {(inputs: Prefpreferred1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preferred`)
};

const fr_prefpreferred1 = /** @type {(inputs: Prefpreferred1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Préférence`)
};

/**
* | output |
* | --- |
* | "Preferred" |
*
* @param {Prefpreferred1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const prefpreferred1 = /** @type {((inputs?: Prefpreferred1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Prefpreferred1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_prefpreferred1(inputs)
	if (locale === "en") return en_prefpreferred1(inputs)
	return fr_prefpreferred1(inputs)
});
export { prefpreferred1 as "prefPreferred" }