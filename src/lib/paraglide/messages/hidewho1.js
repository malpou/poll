/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Hidewho1Inputs */

const da_hidewho1 = /** @type {(inputs: Hidewho1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skjul`)
};

const en_hidewho1 = /** @type {(inputs: Hidewho1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hide`)
};

const fr_hidewho1 = /** @type {(inputs: Hidewho1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masquer`)
};

/**
* | output |
* | --- |
* | "Hide" |
*
* @param {Hidewho1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const hidewho1 = /** @type {((inputs?: Hidewho1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Hidewho1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_hidewho1(inputs)
	if (locale === "en") return en_hidewho1(inputs)
	return fr_hidewho1(inputs)
});
export { hidewho1 as "hideWho" }