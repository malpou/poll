/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Modeassigned1Inputs */

const da_modeassigned1 = /** @type {(inputs: Modeassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navngivne personer (ét link hver)`)
};

const en_modeassigned1 = /** @type {(inputs: Modeassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Named people (one link each)`)
};

const fr_modeassigned1 = /** @type {(inputs: Modeassigned1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnes nommées (un lien chacune)`)
};

/**
* | output |
* | --- |
* | "Named people (one link each)" |
*
* @param {Modeassigned1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const modeassigned1 = /** @type {((inputs?: Modeassigned1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Modeassigned1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_modeassigned1(inputs)
	if (locale === "en") return en_modeassigned1(inputs)
	return fr_modeassigned1(inputs)
});
export { modeassigned1 as "modeAssigned" }