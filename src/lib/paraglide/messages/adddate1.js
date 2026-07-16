/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Adddate1Inputs */

const da_adddate1 = /** @type {(inputs: Adddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Tilføj dato`)
};

const en_adddate1 = /** @type {(inputs: Adddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Add date`)
};

const fr_adddate1 = /** @type {(inputs: Adddate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Ajouter une date`)
};

/**
* | output |
* | --- |
* | "+ Add date" |
*
* @param {Adddate1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const adddate1 = /** @type {((inputs?: Adddate1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Adddate1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_adddate1(inputs)
	if (locale === "en") return en_adddate1(inputs)
	return fr_adddate1(inputs)
});
export { adddate1 as "addDate" }