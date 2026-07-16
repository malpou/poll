/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Responseintro1Inputs */

const da_responseintro1 = /** @type {(inputs: Responseintro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vælg de datoer, der passer dig bedst`)
};

const en_responseintro1 = /** @type {(inputs: Responseintro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose the dates that suit you best`)
};

const fr_responseintro1 = /** @type {(inputs: Responseintro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez les dates qui vous conviennent le mieux`)
};

/**
* | output |
* | --- |
* | "Choose the dates that suit you best" |
*
* @param {Responseintro1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const responseintro1 = /** @type {((inputs?: Responseintro1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Responseintro1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_responseintro1(inputs)
	if (locale === "en") return en_responseintro1(inputs)
	return fr_responseintro1(inputs)
});
export { responseintro1 as "responseIntro" }