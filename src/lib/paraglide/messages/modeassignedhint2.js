/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Modeassignedhint2Inputs */

const da_modeassignedhint2 = /** @type {(inputs: Modeassignedhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du tilføjer hver person og deler deres personlige link.`)
};

const en_modeassignedhint2 = /** @type {(inputs: Modeassignedhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You add each person and share their personal link.`)
};

const fr_modeassignedhint2 = /** @type {(inputs: Modeassignedhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous ajoutez chaque personne et partagez son lien personnel.`)
};

/**
* | output |
* | --- |
* | "You add each person and share their personal link." |
*
* @param {Modeassignedhint2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const modeassignedhint2 = /** @type {((inputs?: Modeassignedhint2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Modeassignedhint2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_modeassignedhint2(inputs)
	if (locale === "en") return en_modeassignedhint2(inputs)
	return fr_modeassignedhint2(inputs)
});
export { modeassignedhint2 as "modeAssignedHint" }