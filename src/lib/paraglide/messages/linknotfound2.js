/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Linknotfound2Inputs */

const da_linknotfound2 = /** @type {(inputs: Linknotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Linket findes ikke`)
};

const en_linknotfound2 = /** @type {(inputs: Linknotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This link doesn't exist`)
};

const fr_linknotfound2 = /** @type {(inputs: Linknotfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce lien n'existe pas`)
};

/**
* | output |
* | --- |
* | "This link doesn't exist" |
*
* @param {Linknotfound2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const linknotfound2 = /** @type {((inputs?: Linknotfound2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Linknotfound2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_linknotfound2(inputs)
	if (locale === "en") return en_linknotfound2(inputs)
	return fr_linknotfound2(inputs)
});
export { linknotfound2 as "linkNotFound" }