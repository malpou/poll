/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Resultssection1Inputs */

const da_resultssection1 = /** @type {(inputs: Resultssection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resultater`)
};

const en_resultssection1 = /** @type {(inputs: Resultssection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Results`)
};

const fr_resultssection1 = /** @type {(inputs: Resultssection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résultats`)
};

/**
* | output |
* | --- |
* | "Results" |
*
* @param {Resultssection1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const resultssection1 = /** @type {((inputs?: Resultssection1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Resultssection1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_resultssection1(inputs)
	if (locale === "en") return en_resultssection1(inputs)
	return fr_resultssection1(inputs)
});
export { resultssection1 as "resultsSection" }