/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Reopenpoll1Inputs */

const da_reopenpoll1 = /** @type {(inputs: Reopenpoll1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Åbn afstemning igen`)
};

const en_reopenpoll1 = /** @type {(inputs: Reopenpoll1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reopen poll`)
};

const fr_reopenpoll1 = /** @type {(inputs: Reopenpoll1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rouvrir le sondage`)
};

/**
* | output |
* | --- |
* | "Reopen poll" |
*
* @param {Reopenpoll1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const reopenpoll1 = /** @type {((inputs?: Reopenpoll1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Reopenpoll1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_reopenpoll1(inputs)
	if (locale === "en") return en_reopenpoll1(inputs)
	return fr_reopenpoll1(inputs)
});
export { reopenpoll1 as "reopenPoll" }