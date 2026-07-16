/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Fieldlanguage1Inputs */

const da_fieldlanguage1 = /** @type {(inputs: Fieldlanguage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sprog`)
};

const en_fieldlanguage1 = /** @type {(inputs: Fieldlanguage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Language`)
};

const fr_fieldlanguage1 = /** @type {(inputs: Fieldlanguage1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Langue`)
};

/**
* | output |
* | --- |
* | "Language" |
*
* @param {Fieldlanguage1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const fieldlanguage1 = /** @type {((inputs?: Fieldlanguage1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fieldlanguage1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_fieldlanguage1(inputs)
	if (locale === "en") return en_fieldlanguage1(inputs)
	return fr_fieldlanguage1(inputs)
});
export { fieldlanguage1 as "fieldLanguage" }