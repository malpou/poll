/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Closedbanner1Inputs */

const da_closedbanner1 = /** @type {(inputs: Closedbanner1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afstemningen er lukket`)
};

const en_closedbanner1 = /** @type {(inputs: Closedbanner1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The poll is closed`)
};

const fr_closedbanner1 = /** @type {(inputs: Closedbanner1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le sondage est clôturé`)
};

/**
* | output |
* | --- |
* | "The poll is closed" |
*
* @param {Closedbanner1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const closedbanner1 = /** @type {((inputs?: Closedbanner1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Closedbanner1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_closedbanner1(inputs)
	if (locale === "en") return en_closedbanner1(inputs)
	return fr_closedbanner1(inputs)
});
export { closedbanner1 as "closedBanner" }