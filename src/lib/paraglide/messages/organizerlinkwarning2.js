/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Organizerlinkwarning2Inputs */

const da_organizerlinkwarning2 = /** @type {(inputs: Organizerlinkwarning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dette er din eneste vej tilbage til afstemningen og resultaterne. Gem det som bogmærke. Det kan ikke gendannes, hvis du mister det. Del det ikke med deltagerne.`)
};

const en_organizerlinkwarning2 = /** @type {(inputs: Organizerlinkwarning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is your only way back to the poll and its results. Bookmark it. It can't be recovered if you lose it. Don't share it with the participants.`)
};

const fr_organizerlinkwarning2 = /** @type {(inputs: Organizerlinkwarning2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est votre seul moyen de revenir au sondage et à ses résultats. Ajoutez-le à vos favoris. Il est irrécupérable en cas de perte. Ne le partagez pas avec les participants.`)
};

/**
* | output |
* | --- |
* | "This is your only way back to the poll and its results. Bookmark it. It can't be recovered if you lose it. Don't share it with the participants." |
*
* @param {Organizerlinkwarning2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const organizerlinkwarning2 = /** @type {((inputs?: Organizerlinkwarning2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organizerlinkwarning2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_organizerlinkwarning2(inputs)
	if (locale === "en") return en_organizerlinkwarning2(inputs)
	return fr_organizerlinkwarning2(inputs)
});
export { organizerlinkwarning2 as "organizerLinkWarning" }