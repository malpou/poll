/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Errorendbeforestart3Inputs */

const da_errorendbeforestart3 = /** @type {(inputs: Errorendbeforestart3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sluttidspunkt kan ikke ligge før starttidspunkt`)
};

const en_errorendbeforestart3 = /** @type {(inputs: Errorendbeforestart3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`End time can't be before the start time`)
};

const fr_errorendbeforestart3 = /** @type {(inputs: Errorendbeforestart3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'heure de fin ne peut pas précéder l'heure de début`)
};

/**
* | output |
* | --- |
* | "End time can't be before the start time" |
*
* @param {Errorendbeforestart3Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const errorendbeforestart3 = /** @type {((inputs?: Errorendbeforestart3Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Errorendbeforestart3Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_errorendbeforestart3(inputs)
	if (locale === "en") return en_errorendbeforestart3(inputs)
	return fr_errorendbeforestart3(inputs)
});
export { errorendbeforestart3 as "errorEndBeforeStart" }