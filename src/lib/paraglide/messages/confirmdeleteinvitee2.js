/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Confirmdeleteinvitee2Inputs */

const da_confirmdeleteinvitee2 = /** @type {(inputs: Confirmdeleteinvitee2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Denne deltager har svaret. Fjern dem alligevel? Deres link holder op med at virke.`)
};

const en_confirmdeleteinvitee2 = /** @type {(inputs: Confirmdeleteinvitee2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This participant has answered. Remove them anyway? Their link will stop working.`)
};

const fr_confirmdeleteinvitee2 = /** @type {(inputs: Confirmdeleteinvitee2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce participant a répondu. Le retirer quand même ? Son lien cessera de fonctionner.`)
};

/**
* | output |
* | --- |
* | "This participant has answered. Remove them anyway? Their link will stop working." |
*
* @param {Confirmdeleteinvitee2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const confirmdeleteinvitee2 = /** @type {((inputs?: Confirmdeleteinvitee2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Confirmdeleteinvitee2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_confirmdeleteinvitee2(inputs)
	if (locale === "en") return en_confirmdeleteinvitee2(inputs)
	return fr_confirmdeleteinvitee2(inputs)
});
export { confirmdeleteinvitee2 as "confirmDeleteInvitee" }