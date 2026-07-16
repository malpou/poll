/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sharelinkhint2Inputs */

const da_sharelinkhint2 = /** @type {(inputs: Sharelinkhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle med dette link kan tilføje deres navn og svar.`)
};

const en_sharelinkhint2 = /** @type {(inputs: Sharelinkhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anyone with this link can add their name and answer.`)
};

const fr_sharelinkhint2 = /** @type {(inputs: Sharelinkhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toute personne ayant ce lien peut ajouter son nom et sa réponse.`)
};

/**
* | output |
* | --- |
* | "Anyone with this link can add their name and answer." |
*
* @param {Sharelinkhint2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const sharelinkhint2 = /** @type {((inputs?: Sharelinkhint2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sharelinkhint2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_sharelinkhint2(inputs)
	if (locale === "en") return en_sharelinkhint2(inputs)
	return fr_sharelinkhint2(inputs)
});
export { sharelinkhint2 as "shareLinkHint" }