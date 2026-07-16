/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Linkcopied1Inputs */

const da_linkcopied1 = /** @type {(inputs: Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Linket er kopieret`)
};

const en_linkcopied1 = /** @type {(inputs: Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link copied`)
};

const fr_linkcopied1 = /** @type {(inputs: Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien copié`)
};

/**
* | output |
* | --- |
* | "Link copied" |
*
* @param {Linkcopied1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const linkcopied1 = /** @type {((inputs?: Linkcopied1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Linkcopied1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_linkcopied1(inputs)
	if (locale === "en") return en_linkcopied1(inputs)
	return fr_linkcopied1(inputs)
});
export { linkcopied1 as "linkCopied" }