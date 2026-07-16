/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} NameInputs */

const da_name = /** @type {(inputs: NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navn`)
};

const en_name = /** @type {(inputs: NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Name`)
};

const fr_name = /** @type {(inputs: NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nom`)
};

/**
* | output |
* | --- |
* | "Name" |
*
* @param {NameInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const name = /** @type {((inputs?: NameInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<NameInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_name(inputs)
	if (locale === "en") return en_name(inputs)
	return fr_name(inputs)
});