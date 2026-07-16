/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Nameprompt1Inputs */

const da_nameprompt1 = /** @type {(inputs: Nameprompt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dit navn`)
};

const en_nameprompt1 = /** @type {(inputs: Nameprompt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your name`)
};

const fr_nameprompt1 = /** @type {(inputs: Nameprompt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre nom`)
};

/**
* | output |
* | --- |
* | "Your name" |
*
* @param {Nameprompt1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const nameprompt1 = /** @type {((inputs?: Nameprompt1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nameprompt1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_nameprompt1(inputs)
	if (locale === "en") return en_nameprompt1(inputs)
	return fr_nameprompt1(inputs)
});
export { nameprompt1 as "namePrompt" }