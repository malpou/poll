/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addparticipant1Inputs */

const da_addparticipant1 = /** @type {(inputs: Addparticipant1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Tilføj deltager`)
};

const en_addparticipant1 = /** @type {(inputs: Addparticipant1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Add participant`)
};

const fr_addparticipant1 = /** @type {(inputs: Addparticipant1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`+ Ajouter un participant`)
};

/**
* | output |
* | --- |
* | "+ Add participant" |
*
* @param {Addparticipant1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const addparticipant1 = /** @type {((inputs?: Addparticipant1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addparticipant1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_addparticipant1(inputs)
	if (locale === "en") return en_addparticipant1(inputs)
	return fr_addparticipant1(inputs)
});
export { addparticipant1 as "addParticipant" }