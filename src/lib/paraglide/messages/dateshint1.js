/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dateshint1Inputs */

const da_dateshint1 = /** @type {(inputs: Dateshint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tilføj mindst én dato. Tidspunkter er valgfri.`)
};

const en_dateshint1 = /** @type {(inputs: Dateshint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add at least one date. Times are optional.`)
};

const fr_dateshint1 = /** @type {(inputs: Dateshint1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez au moins une date. Les horaires sont facultatifs.`)
};

/**
* | output |
* | --- |
* | "Add at least one date. Times are optional." |
*
* @param {Dateshint1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const dateshint1 = /** @type {((inputs?: Dateshint1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dateshint1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_dateshint1(inputs)
	if (locale === "en") return en_dateshint1(inputs)
	return fr_dateshint1(inputs)
});
export { dateshint1 as "datesHint" }