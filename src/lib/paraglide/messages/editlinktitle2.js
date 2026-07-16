/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editlinktitle2Inputs */

const da_editlinktitle2 = /** @type {(inputs: Editlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dit redigeringslink`)
};

const en_editlinktitle2 = /** @type {(inputs: Editlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your edit link`)
};

const fr_editlinktitle2 = /** @type {(inputs: Editlinktitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre lien de modification`)
};

/**
* | output |
* | --- |
* | "Your edit link" |
*
* @param {Editlinktitle2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const editlinktitle2 = /** @type {((inputs?: Editlinktitle2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editlinktitle2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_editlinktitle2(inputs)
	if (locale === "en") return en_editlinktitle2(inputs)
	return fr_editlinktitle2(inputs)
});
export { editlinktitle2 as "editLinkTitle" }