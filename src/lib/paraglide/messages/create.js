/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} CreateInputs */

const da_create = /** @type {(inputs: CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opret afstemning`)
};

const en_create = /** @type {(inputs: CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create poll`)
};

const fr_create = /** @type {(inputs: CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer le sondage`)
};

/**
* | output |
* | --- |
* | "Create poll" |
*
* @param {CreateInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const create = /** @type {((inputs?: CreateInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<CreateInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_create(inputs)
	if (locale === "en") return en_create(inputs)
	return fr_create(inputs)
});