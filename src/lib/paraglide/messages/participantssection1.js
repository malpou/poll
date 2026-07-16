/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Participantssection1Inputs */

const da_participantssection1 = /** @type {(inputs: Participantssection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deltagere`)
};

const en_participantssection1 = /** @type {(inputs: Participantssection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Participants`)
};

const fr_participantssection1 = /** @type {(inputs: Participantssection1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Participants`)
};

/**
* | output |
* | --- |
* | "Participants" |
*
* @param {Participantssection1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const participantssection1 = /** @type {((inputs?: Participantssection1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Participantssection1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_participantssection1(inputs)
	if (locale === "en") return en_participantssection1(inputs)
	return fr_participantssection1(inputs)
});
export { participantssection1 as "participantsSection" }