/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Noteplaceholder1Inputs */

const da_noteplaceholder1 = /** @type {(inputs: Noteplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fx: Jeg kan ikke om morgenen`)
};

const en_noteplaceholder1 = /** @type {(inputs: Noteplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E.g.: I can't do mornings`)
};

const fr_noteplaceholder1 = /** @type {(inputs: Noteplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ex. : je ne peux pas le matin`)
};

/**
* | output |
* | --- |
* | "E.g.: I can't do mornings" |
*
* @param {Noteplaceholder1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const noteplaceholder1 = /** @type {((inputs?: Noteplaceholder1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Noteplaceholder1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_noteplaceholder1(inputs)
	if (locale === "en") return en_noteplaceholder1(inputs)
	return fr_noteplaceholder1(inputs)
});
export { noteplaceholder1 as "notePlaceholder" }