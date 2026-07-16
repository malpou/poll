/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Savedtitle1Inputs */

const da_savedtitle1 = /** @type {(inputs: Savedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tak! Dit svar er gemt.`)
};

const en_savedtitle1 = /** @type {(inputs: Savedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Thanks! Your answer is saved.`)
};

const fr_savedtitle1 = /** @type {(inputs: Savedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merci ! Votre réponse est enregistrée.`)
};

/**
* | output |
* | --- |
* | "Thanks! Your answer is saved." |
*
* @param {Savedtitle1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const savedtitle1 = /** @type {((inputs?: Savedtitle1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Savedtitle1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_savedtitle1(inputs)
	if (locale === "en") return en_savedtitle1(inputs)
	return fr_savedtitle1(inputs)
});
export { savedtitle1 as "savedTitle" }