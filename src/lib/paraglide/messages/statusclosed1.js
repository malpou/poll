/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Statusclosed1Inputs */

const da_statusclosed1 = /** @type {(inputs: Statusclosed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lukket`)
};

const en_statusclosed1 = /** @type {(inputs: Statusclosed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Closed`)
};

const fr_statusclosed1 = /** @type {(inputs: Statusclosed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clôturé`)
};

/**
* | output |
* | --- |
* | "Closed" |
*
* @param {Statusclosed1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const statusclosed1 = /** @type {((inputs?: Statusclosed1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Statusclosed1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_statusclosed1(inputs)
	if (locale === "en") return en_statusclosed1(inputs)
	return fr_statusclosed1(inputs)
});
export { statusclosed1 as "statusClosed" }