/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Linknotfoundsub3Inputs */

const da_linknotfoundsub3 = /** @type {(inputs: Linknotfoundsub3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tjek at du har hele linket med, eller bed arrangøren sende det igen.`)
};

const en_linknotfoundsub3 = /** @type {(inputs: Linknotfoundsub3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check that you copied the whole link, or ask the organizer to send it again.`)
};

const fr_linknotfoundsub3 = /** @type {(inputs: Linknotfoundsub3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que vous avez copié le lien en entier, ou demandez à l'organisateur de le renvoyer.`)
};

/**
* | output |
* | --- |
* | "Check that you copied the whole link, or ask the organizer to send it again." |
*
* @param {Linknotfoundsub3Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const linknotfoundsub3 = /** @type {((inputs?: Linknotfoundsub3Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Linknotfoundsub3Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_linknotfoundsub3(inputs)
	if (locale === "en") return en_linknotfoundsub3(inputs)
	return fr_linknotfoundsub3(inputs)
});
export { linknotfoundsub3 as "linkNotFoundSub" }