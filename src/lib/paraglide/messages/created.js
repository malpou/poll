/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} CreatedInputs */

const da_created = /** @type {(inputs: CreatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oprettet`)
};

const en_created = /** @type {(inputs: CreatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created`)
};

const fr_created = /** @type {(inputs: CreatedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créé`)
};

/**
* | output |
* | --- |
* | "Created" |
*
* @param {CreatedInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const created = /** @type {((inputs?: CreatedInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<CreatedInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_created(inputs)
	if (locale === "en") return en_created(inputs)
	return fr_created(inputs)
});