/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} RemoveInputs */

const da_remove = /** @type {(inputs: RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fjern`)
};

const en_remove = /** @type {(inputs: RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remove`)
};

const fr_remove = /** @type {(inputs: RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

/**
* | output |
* | --- |
* | "Remove" |
*
* @param {RemoveInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const remove = /** @type {((inputs?: RemoveInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<RemoveInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_remove(inputs)
	if (locale === "en") return en_remove(inputs)
	return fr_remove(inputs)
});