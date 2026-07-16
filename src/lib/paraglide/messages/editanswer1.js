/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editanswer1Inputs */

const da_editanswer1 = /** @type {(inputs: Editanswer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rediger`)
};

const en_editanswer1 = /** @type {(inputs: Editanswer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit`)
};

const fr_editanswer1 = /** @type {(inputs: Editanswer1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Editanswer1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const editanswer1 = /** @type {((inputs?: Editanswer1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editanswer1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_editanswer1(inputs)
	if (locale === "en") return en_editanswer1(inputs)
	return fr_editanswer1(inputs)
});
export { editanswer1 as "editAnswer" }