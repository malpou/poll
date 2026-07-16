/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} PendingInputs */

const da_pending = /** @type {(inputs: PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mangler at svare`)
};

const en_pending = /** @type {(inputs: PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not yet answered`)
};

const fr_pending = /** @type {(inputs: PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore répondu`)
};

/**
* | output |
* | --- |
* | "Not yet answered" |
*
* @param {PendingInputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pending = /** @type {((inputs?: PendingInputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<PendingInputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_pending(inputs)
	if (locale === "en") return en_pending(inputs)
	return fr_pending(inputs)
});