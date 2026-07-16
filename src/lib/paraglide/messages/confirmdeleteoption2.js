/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Confirmdeleteoption2Inputs */

const da_confirmdeleteoption2 = /** @type {(inputs: Confirmdeleteoption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Denne dato har svar. Slet den alligevel?`)
};

const en_confirmdeleteoption2 = /** @type {(inputs: Confirmdeleteoption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This date has answers. Delete it anyway?`)
};

const fr_confirmdeleteoption2 = /** @type {(inputs: Confirmdeleteoption2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette date a des réponses. La supprimer quand même ?`)
};

/**
* | output |
* | --- |
* | "This date has answers. Delete it anyway?" |
*
* @param {Confirmdeleteoption2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const confirmdeleteoption2 = /** @type {((inputs?: Confirmdeleteoption2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Confirmdeleteoption2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_confirmdeleteoption2(inputs)
	if (locale === "en") return en_confirmdeleteoption2(inputs)
	return fr_confirmdeleteoption2(inputs)
});
export { confirmdeleteoption2 as "confirmDeleteOption" }