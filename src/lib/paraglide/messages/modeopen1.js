/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Modeopen1Inputs */

const da_modeopen1 = /** @type {(inputs: Modeopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle med linket`)
};

const en_modeopen1 = /** @type {(inputs: Modeopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anyone with the link`)
};

const fr_modeopen1 = /** @type {(inputs: Modeopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toute personne ayant le lien`)
};

/**
* | output |
* | --- |
* | "Anyone with the link" |
*
* @param {Modeopen1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const modeopen1 = /** @type {((inputs?: Modeopen1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Modeopen1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_modeopen1(inputs)
	if (locale === "en") return en_modeopen1(inputs)
	return fr_modeopen1(inputs)
});
export { modeopen1 as "modeOpen" }