/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Errornodates2Inputs */

const da_errornodates2 = /** @type {(inputs: Errornodates2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tilføj mindst én dato`)
};

const en_errornodates2 = /** @type {(inputs: Errornodates2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add at least one date`)
};

const fr_errornodates2 = /** @type {(inputs: Errornodates2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez au moins une date`)
};

/**
* | output |
* | --- |
* | "Add at least one date" |
*
* @param {Errornodates2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const errornodates2 = /** @type {((inputs?: Errornodates2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Errornodates2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_errornodates2(inputs)
	if (locale === "en") return en_errornodates2(inputs)
	return fr_errornodates2(inputs)
});
export { errornodates2 as "errorNoDates" }