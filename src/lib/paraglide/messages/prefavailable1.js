/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Prefavailable1Inputs */

const da_prefavailable1 = /** @type {(inputs: Prefavailable1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kan godt`)
};

const en_prefavailable1 = /** @type {(inputs: Prefavailable1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Can make it`)
};

const fr_prefavailable1 = /** @type {(inputs: Prefavailable1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disponible`)
};

/**
* | output |
* | --- |
* | "Can make it" |
*
* @param {Prefavailable1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const prefavailable1 = /** @type {((inputs?: Prefavailable1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Prefavailable1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_prefavailable1(inputs)
	if (locale === "en") return en_prefavailable1(inputs)
	return fr_prefavailable1(inputs)
});
export { prefavailable1 as "prefAvailable" }