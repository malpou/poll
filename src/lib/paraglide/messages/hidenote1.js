/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Hidenote1Inputs */

const da_hidenote1 = /** @type {(inputs: Hidenote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skjul bemærkning`)
};

const en_hidenote1 = /** @type {(inputs: Hidenote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide note`)
};

const fr_hidenote1 = /** @type {(inputs: Hidenote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masquer la remarque`)
};

/**
* | output |
* | --- |
* | "Hide note" |
*
* @param {Hidenote1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const hidenote1 = /** @type {((inputs?: Hidenote1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Hidenote1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_hidenote1(inputs)
	if (locale === "en") return en_hidenote1(inputs)
	return fr_hidenote1(inputs)
});
export { hidenote1 as "hideNote" }