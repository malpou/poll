/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sendanswer1Inputs */

const da_sendanswer1 = /** @type {(inputs: Sendanswer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send svar`)
};

const en_sendanswer1 = /** @type {(inputs: Sendanswer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send answer`)
};

const fr_sendanswer1 = /** @type {(inputs: Sendanswer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la réponse`)
};

/**
* | output |
* | --- |
* | "Send answer" |
*
* @param {Sendanswer1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const sendanswer1 = /** @type {((inputs?: Sendanswer1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sendanswer1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_sendanswer1(inputs)
	if (locale === "en") return en_sendanswer1(inputs)
	return fr_sendanswer1(inputs)
});
export { sendanswer1 as "sendAnswer" }