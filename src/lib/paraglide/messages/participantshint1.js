/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Participantshint1Inputs */

const da_participantshint1 = /** @type {(inputs: Participantshint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Giv hver deltager et navn, og kopiér deres link til dem bagefter.`)
};

const en_participantshint1 = /** @type {(inputs: Participantshint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Give each participant a name, then copy their link and send it to them.`)
};

const fr_participantshint1 = /** @type {(inputs: Participantshint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Donnez un nom à chaque participant, puis copiez son lien et envoyez-le-lui.`)
};

/**
* | output |
* | --- |
* | "Give each participant a name, then copy their link and send it to them." |
*
* @param {Participantshint1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const participantshint1 = /** @type {((inputs?: Participantshint1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Participantshint1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_participantshint1(inputs)
	if (locale === "en") return en_participantshint1(inputs)
	return fr_participantshint1(inputs)
});
export { participantshint1 as "participantsHint" }