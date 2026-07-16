/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Langen1Inputs */

const da_langen1 = /** @type {(inputs: Langen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Engelsk`)
};

const en_langen1 = /** @type {(inputs: Langen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`English`)
};

const fr_langen1 = /** @type {(inputs: Langen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anglais`)
};

/**
* | output |
* | --- |
* | "English" |
*
* @param {Langen1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const langen1 = /** @type {((inputs?: Langen1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Langen1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_langen1(inputs)
	if (locale === "en") return en_langen1(inputs)
	return fr_langen1(inputs)
});
export { langen1 as "langEn" }