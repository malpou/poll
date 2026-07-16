/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sharelinktitle2Inputs */

const da_sharelinktitle2 = /** @type {(inputs: Sharelinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fælles link`)
};

const en_sharelinktitle2 = /** @type {(inputs: Sharelinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Shared link`)
};

const fr_sharelinktitle2 = /** @type {(inputs: Sharelinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien partagé`)
};

/**
* | output |
* | --- |
* | "Shared link" |
*
* @param {Sharelinktitle2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const sharelinktitle2 = /** @type {((inputs?: Sharelinktitle2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sharelinktitle2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_sharelinktitle2(inputs)
	if (locale === "en") return en_sharelinktitle2(inputs)
	return fr_sharelinktitle2(inputs)
});
export { sharelinktitle2 as "shareLinkTitle" }