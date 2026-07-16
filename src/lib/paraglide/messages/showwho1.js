/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Showwho1Inputs */

const da_showwho1 = /** @type {(inputs: Showwho1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vis hvem der har svaret`)
};

const en_showwho1 = /** @type {(inputs: Showwho1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show who answered`)
};

const fr_showwho1 = /** @type {(inputs: Showwho1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir qui a répondu`)
};

/**
* | output |
* | --- |
* | "Show who answered" |
*
* @param {Showwho1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const showwho1 = /** @type {((inputs?: Showwho1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Showwho1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_showwho1(inputs)
	if (locale === "en") return en_showwho1(inputs)
	return fr_showwho1(inputs)
});
export { showwho1 as "showWho" }