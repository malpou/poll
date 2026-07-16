/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Fieldtitle1Inputs */

const da_fieldtitle1 = /** @type {(inputs: Fieldtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titel`)
};

const en_fieldtitle1 = /** @type {(inputs: Fieldtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Title`)
};

const fr_fieldtitle1 = /** @type {(inputs: Fieldtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre`)
};

/**
* | output |
* | --- |
* | "Title" |
*
* @param {Fieldtitle1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const fieldtitle1 = /** @type {((inputs?: Fieldtitle1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fieldtitle1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_fieldtitle1(inputs)
	if (locale === "en") return en_fieldtitle1(inputs)
	return fr_fieldtitle1(inputs)
});
export { fieldtitle1 as "fieldTitle" }