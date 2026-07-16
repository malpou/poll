/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Chooseeach1Inputs */

const da_chooseeach1 = /** @type {(inputs: Chooseeach1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vælg en mulighed for hver dato`)
};

const en_chooseeach1 = /** @type {(inputs: Chooseeach1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose an option for each date`)
};

const fr_chooseeach1 = /** @type {(inputs: Chooseeach1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez une option pour chaque date`)
};

/**
* | output |
* | --- |
* | "Choose an option for each date" |
*
* @param {Chooseeach1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const chooseeach1 = /** @type {((inputs?: Chooseeach1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Chooseeach1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_chooseeach1(inputs)
	if (locale === "en") return en_chooseeach1(inputs)
	return fr_chooseeach1(inputs)
});
export { chooseeach1 as "chooseEach" }