/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Fielddescription1Inputs */

const da_fielddescription1 = /** @type {(inputs: Fielddescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beskrivelse`)
};

const en_fielddescription1 = /** @type {(inputs: Fielddescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

const fr_fielddescription1 = /** @type {(inputs: Fielddescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Description`)
};

/**
* | output |
* | --- |
* | "Description" |
*
* @param {Fielddescription1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const fielddescription1 = /** @type {((inputs?: Fielddescription1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fielddescription1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_fielddescription1(inputs)
	if (locale === "en") return en_fielddescription1(inputs)
	return fr_fielddescription1(inputs)
});
export { fielddescription1 as "fieldDescription" }