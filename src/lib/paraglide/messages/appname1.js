/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appname1Inputs */

const da_appname1 = /** @type {(inputs: Appname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datoafstemning`)
};

const en_appname1 = /** @type {(inputs: Appname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date poll`)
};

const fr_appname1 = /** @type {(inputs: Appname1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sondage de disponibilités`)
};

/**
* | output |
* | --- |
* | "Date poll" |
*
* @param {Appname1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const appname1 = /** @type {((inputs?: Appname1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appname1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_appname1(inputs)
	if (locale === "en") return en_appname1(inputs)
	return fr_appname1(inputs)
});
export { appname1 as "appName" }