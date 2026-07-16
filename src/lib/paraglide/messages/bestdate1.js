/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Bestdate1Inputs */

const da_bestdate1 = /** @type {(inputs: Bestdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bedste dato`)
};

const en_bestdate1 = /** @type {(inputs: Bestdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Best date`)
};

const fr_bestdate1 = /** @type {(inputs: Bestdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Meilleure date`)
};

/**
* | output |
* | --- |
* | "Best date" |
*
* @param {Bestdate1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const bestdate1 = /** @type {((inputs?: Bestdate1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Bestdate1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_bestdate1(inputs)
	if (locale === "en") return en_bestdate1(inputs)
	return fr_bestdate1(inputs)
});
export { bestdate1 as "bestDate" }