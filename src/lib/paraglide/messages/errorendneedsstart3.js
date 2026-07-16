/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Errorendneedsstart3Inputs */

const da_errorendneedsstart3 = /** @type {(inputs: Errorendneedsstart3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Angiv et starttidspunkt før du sætter et sluttidspunkt`)
};

const en_errorendneedsstart3 = /** @type {(inputs: Errorendneedsstart3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set a start time before adding an end time`)
};

const fr_errorendneedsstart3 = /** @type {(inputs: Errorendneedsstart3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Indiquez une heure de début avant d'ajouter une heure de fin`)
};

/**
* | output |
* | --- |
* | "Set a start time before adding an end time" |
*
* @param {Errorendneedsstart3Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const errorendneedsstart3 = /** @type {((inputs?: Errorendneedsstart3Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Errorendneedsstart3Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_errorendneedsstart3(inputs)
	if (locale === "en") return en_errorendneedsstart3(inputs)
	return fr_errorendneedsstart3(inputs)
});
export { errorendneedsstart3 as "errorEndNeedsStart" }