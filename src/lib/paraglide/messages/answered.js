/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} AnsweredInputs */

const da_answered = /** @type {(inputs: AnsweredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Har svaret`)
};

const en_answered = /** @type {(inputs: AnsweredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Answered`)
};

const fr_answered = /** @type {(inputs: AnsweredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A répondu`)
};

/**
* | output |
* | --- |
* | "Answered" |
*
* @param {AnsweredInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const answered = /** @type {((inputs?: AnsweredInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<AnsweredInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_answered(inputs)
	if (locale === "en") return en_answered(inputs)
	return fr_answered(inputs)
});