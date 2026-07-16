/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Langda1Inputs */

const da_langda1 = /** @type {(inputs: Langda1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dansk`)
};

const en_langda1 = /** @type {(inputs: Langda1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Danish`)
};

const fr_langda1 = /** @type {(inputs: Langda1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Danois`)
};

/**
* | output |
* | --- |
* | "Danish" |
*
* @param {Langda1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const langda1 = /** @type {((inputs?: Langda1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Langda1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_langda1(inputs)
	if (locale === "en") return en_langda1(inputs)
	return fr_langda1(inputs)
});
export { langda1 as "langDa" }