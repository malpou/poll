/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Savedsub1Inputs */

const da_savedsub1 = /** @type {(inputs: Savedsub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Du kan ændre dit svar, indtil afstemningen lukker.`)
};

const en_savedsub1 = /** @type {(inputs: Savedsub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You can change your answer until the poll closes.`)
};

const fr_savedsub1 = /** @type {(inputs: Savedsub1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous pouvez modifier votre réponse jusqu'à la clôture du sondage.`)
};

/**
* | output |
* | --- |
* | "You can change your answer until the poll closes." |
*
* @param {Savedsub1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const savedsub1 = /** @type {((inputs?: Savedsub1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Savedsub1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_savedsub1(inputs)
	if (locale === "en") return en_savedsub1(inputs)
	return fr_savedsub1(inputs)
});
export { savedsub1 as "savedSub" }