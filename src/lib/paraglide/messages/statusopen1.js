/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Statusopen1Inputs */

const da_statusopen1 = /** @type {(inputs: Statusopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Åben`)
};

const en_statusopen1 = /** @type {(inputs: Statusopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open`)
};

const fr_statusopen1 = /** @type {(inputs: Statusopen1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvert`)
};

/**
* | output |
* | --- |
* | "Open" |
*
* @param {Statusopen1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const statusopen1 = /** @type {((inputs?: Statusopen1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Statusopen1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_statusopen1(inputs)
	if (locale === "en") return en_statusopen1(inputs)
	return fr_statusopen1(inputs)
});
export { statusopen1 as "statusOpen" }