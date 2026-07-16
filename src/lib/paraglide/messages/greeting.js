/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} GreetingInputs */

const da_greeting = /** @type {(inputs: GreetingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hej ${i?.name}`)
};

const en_greeting = /** @type {(inputs: GreetingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hi ${i?.name}`)
};

const fr_greeting = /** @type {(inputs: GreetingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Bonjour ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Hi {name}" |
*
* @param {GreetingInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const greeting = /** @type {((inputs: GreetingInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<GreetingInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_greeting(inputs)
	if (locale === "en") return en_greeting(inputs)
	return fr_greeting(inputs)
});