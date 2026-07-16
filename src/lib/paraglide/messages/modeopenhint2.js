/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Modeopenhint2Inputs */

const da_modeopenhint2 = /** @type {(inputs: Modeopenhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ét fælles link. Alle der åbner det, skriver deres eget navn og svar.`)
};

const en_modeopenhint2 = /** @type {(inputs: Modeopenhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`One shared link. Anyone who opens it enters their own name and answer.`)
};

const fr_modeopenhint2 = /** @type {(inputs: Modeopenhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un lien partagé. Quiconque l'ouvre saisit son nom et sa réponse.`)
};

/**
* | output |
* | --- |
* | "One shared link. Anyone who opens it enters their own name and answer." |
*
* @param {Modeopenhint2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const modeopenhint2 = /** @type {((inputs?: Modeopenhint2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Modeopenhint2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_modeopenhint2(inputs)
	if (locale === "en") return en_modeopenhint2(inputs)
	return fr_modeopenhint2(inputs)
});
export { modeopenhint2 as "modeOpenHint" }