/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} ToInputs */

const da_to = /** @type {(inputs: ToInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Til`)
};

const en_to = /** @type {(inputs: ToInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To`)
};

const fr_to = /** @type {(inputs: ToInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À`)
};

/**
* | output |
* | --- |
* | "To" |
*
* @param {ToInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const to = /** @type {((inputs?: ToInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<ToInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_to(inputs)
	if (locale === "en") return en_to(inputs)
	return fr_to(inputs)
});