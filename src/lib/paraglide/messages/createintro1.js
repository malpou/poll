/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createintro1Inputs */

const da_createintro1 = /** @type {(inputs: Createintro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vælg nogle datoer, tilføj de personer du vil spørge, og del deres personlige link. Hver deltager svarer, om de foretrækker, kan eller ikke kan.`)
};

const en_createintro1 = /** @type {(inputs: Createintro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pick some dates, add the people you want to ask, and share their personal link. Each participant answers whether they prefer, can, or can't make it.`)
};

const fr_createintro1 = /** @type {(inputs: Createintro1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez des dates, ajoutez les personnes à consulter et partagez leur lien personnel. Chaque participant indique ses préférences, s´il peut ou ne peut pas.`)
};

/**
* | output |
* | --- |
* | "Pick some dates, add the people you want to ask, and share their personal link. Each participant answers whether they prefer, can, or can't make it." |
*
* @param {Createintro1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const createintro1 = /** @type {((inputs?: Createintro1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createintro1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_createintro1(inputs)
	if (locale === "en") return en_createintro1(inputs)
	return fr_createintro1(inputs)
});
export { createintro1 as "createIntro" }