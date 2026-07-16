/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editlinkhint2Inputs */

const da_editlinkhint2 = /** @type {(inputs: Editlinkhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gem det for at ændre dit svar senere.`)
};

const en_editlinkhint2 = /** @type {(inputs: Editlinkhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save this to change your answer later.`)
};

const fr_editlinkhint2 = /** @type {(inputs: Editlinkhint2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrez-le pour modifier votre réponse plus tard.`)
};

/**
* | output |
* | --- |
* | "Save this to change your answer later." |
*
* @param {Editlinkhint2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const editlinkhint2 = /** @type {((inputs?: Editlinkhint2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editlinkhint2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_editlinkhint2(inputs)
	if (locale === "en") return en_editlinkhint2(inputs)
	return fr_editlinkhint2(inputs)
});
export { editlinkhint2 as "editLinkHint" }