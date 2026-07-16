/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Shownote1Inputs */

const da_shownote1 = /** @type {(inputs: Shownote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vis bemærkning`)
};

const en_shownote1 = /** @type {(inputs: Shownote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show note`)
};

const fr_shownote1 = /** @type {(inputs: Shownote1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la remarque`)
};

/**
* | output |
* | --- |
* | "Show note" |
*
* @param {Shownote1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const shownote1 = /** @type {((inputs?: Shownote1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Shownote1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_shownote1(inputs)
	if (locale === "en") return en_shownote1(inputs)
	return fr_shownote1(inputs)
});
export { shownote1 as "showNote" }