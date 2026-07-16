/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Fieldmode1Inputs */

const da_fieldmode1 = /** @type {(inputs: Fieldmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hvem kan svare`)
};

const en_fieldmode1 = /** @type {(inputs: Fieldmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who can respond`)
};

const fr_fieldmode1 = /** @type {(inputs: Fieldmode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qui peut répondre`)
};

/**
* | output |
* | --- |
* | "Who can respond" |
*
* @param {Fieldmode1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const fieldmode1 = /** @type {((inputs?: Fieldmode1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Fieldmode1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_fieldmode1(inputs)
	if (locale === "en") return en_fieldmode1(inputs)
	return fr_fieldmode1(inputs)
});
export { fieldmode1 as "fieldMode" }