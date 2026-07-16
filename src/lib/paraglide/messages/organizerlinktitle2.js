/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Organizerlinktitle2Inputs */

const da_organizerlinktitle2 = /** @type {(inputs: Organizerlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gem dette link`)
};

const en_organizerlinktitle2 = /** @type {(inputs: Organizerlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save this link`)
};

const fr_organizerlinktitle2 = /** @type {(inputs: Organizerlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrez ce lien`)
};

/**
* | output |
* | --- |
* | "Save this link" |
*
* @param {Organizerlinktitle2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const organizerlinktitle2 = /** @type {((inputs?: Organizerlinktitle2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organizerlinktitle2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_organizerlinktitle2(inputs)
	if (locale === "en") return en_organizerlinktitle2(inputs)
	return fr_organizerlinktitle2(inputs)
});
export { organizerlinktitle2 as "organizerLinkTitle" }