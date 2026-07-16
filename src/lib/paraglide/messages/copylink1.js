/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Copylink1Inputs */

const da_copylink1 = /** @type {(inputs: Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kopiér link`)
};

const en_copylink1 = /** @type {(inputs: Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy link`)
};

const fr_copylink1 = /** @type {(inputs: Copylink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le lien`)
};

/**
* | output |
* | --- |
* | "Copy link" |
*
* @param {Copylink1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const copylink1 = /** @type {((inputs?: Copylink1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Copylink1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_copylink1(inputs)
	if (locale === "en") return en_copylink1(inputs)
	return fr_copylink1(inputs)
});
export { copylink1 as "copyLink" }