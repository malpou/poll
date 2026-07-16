/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createtitle1Inputs */

const da_createtitle1 = /** @type {(inputs: Createtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Opret afstemning`)
};

const en_createtitle1 = /** @type {(inputs: Createtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create a poll`)
};

const fr_createtitle1 = /** @type {(inputs: Createtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un sondage`)
};

/**
* | output |
* | --- |
* | "Create a poll" |
*
* @param {Createtitle1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const createtitle1 = /** @type {((inputs?: Createtitle1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createtitle1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_createtitle1(inputs)
	if (locale === "en") return en_createtitle1(inputs)
	return fr_createtitle1(inputs)
});
export { createtitle1 as "createTitle" }