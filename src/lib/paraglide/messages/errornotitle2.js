/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Errornotitle2Inputs */

const da_errornotitle2 = /** @type {(inputs: Errornotitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Giv afstemningen en titel`)
};

const en_errornotitle2 = /** @type {(inputs: Errornotitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Give the poll a title`)
};

const fr_errornotitle2 = /** @type {(inputs: Errornotitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Donnez un titre au sondage`)
};

/**
* | output |
* | --- |
* | "Give the poll a title" |
*
* @param {Errornotitle2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const errornotitle2 = /** @type {((inputs?: Errornotitle2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Errornotitle2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_errornotitle2(inputs)
	if (locale === "en") return en_errornotitle2(inputs)
	return fr_errornotitle2(inputs)
});
export { errornotitle2 as "errorNoTitle" }