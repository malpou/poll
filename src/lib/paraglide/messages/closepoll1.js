/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Closepoll1Inputs */

const da_closepoll1 = /** @type {(inputs: Closepoll1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Luk afstemning`)
};

const en_closepoll1 = /** @type {(inputs: Closepoll1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Close poll`)
};

const fr_closepoll1 = /** @type {(inputs: Closepoll1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clôturer le sondage`)
};

/**
* | output |
* | --- |
* | "Close poll" |
*
* @param {Closepoll1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const closepoll1 = /** @type {((inputs?: Closepoll1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Closepoll1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_closepoll1(inputs)
	if (locale === "en") return en_closepoll1(inputs)
	return fr_closepoll1(inputs)
});
export { closepoll1 as "closePoll" }