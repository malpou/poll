/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datesquestion1Inputs */

const da_datesquestion1 = /** @type {(inputs: Datesquestion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hvordan passer datoerne dig?`)
};

const en_datesquestion1 = /** @type {(inputs: Datesquestion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How do these dates suit you?`)
};

const fr_datesquestion1 = /** @type {(inputs: Datesquestion1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ces dates vous conviennent-elles ?`)
};

/**
* | output |
* | --- |
* | "How do these dates suit you?" |
*
* @param {Datesquestion1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const datesquestion1 = /** @type {((inputs?: Datesquestion1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datesquestion1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_datesquestion1(inputs)
	if (locale === "en") return en_datesquestion1(inputs)
	return fr_datesquestion1(inputs)
});
export { datesquestion1 as "datesQuestion" }