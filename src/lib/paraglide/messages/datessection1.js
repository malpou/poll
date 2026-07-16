/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datessection1Inputs */

const da_datessection1 = /** @type {(inputs: Datessection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mulige datoer`)
};

const en_datessection1 = /** @type {(inputs: Datessection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Possible dates`)
};

const fr_datessection1 = /** @type {(inputs: Datessection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dates possibles`)
};

/**
* | output |
* | --- |
* | "Possible dates" |
*
* @param {Datessection1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const datessection1 = /** @type {((inputs?: Datessection1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datessection1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_datessection1(inputs)
	if (locale === "en") return en_datessection1(inputs)
	return fr_datessection1(inputs)
});
export { datessection1 as "datesSection" }