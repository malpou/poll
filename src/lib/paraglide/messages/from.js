/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} FromInputs */

const da_from = /** @type {(inputs: FromInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fra`)
};

const en_from = /** @type {(inputs: FromInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`From`)
};

const fr_from = /** @type {(inputs: FromInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`De`)
};

/**
* | output |
* | --- |
* | "From" |
*
* @param {FromInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const from = /** @type {((inputs?: FromInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<FromInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_from(inputs)
	if (locale === "en") return en_from(inputs)
	return fr_from(inputs)
});