/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Notelabel1Inputs */

const da_notelabel1 = /** @type {(inputs: Notelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bemærkning (valgfri)`)
};

const en_notelabel1 = /** @type {(inputs: Notelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Note (optional)`)
};

const fr_notelabel1 = /** @type {(inputs: Notelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remarque (facultatif)`)
};

/**
* | output |
* | --- |
* | "Note (optional)" |
*
* @param {Notelabel1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const notelabel1 = /** @type {((inputs?: Notelabel1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notelabel1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_notelabel1(inputs)
	if (locale === "en") return en_notelabel1(inputs)
	return fr_notelabel1(inputs)
});
export { notelabel1 as "noteLabel" }