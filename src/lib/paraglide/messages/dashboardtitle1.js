/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboardtitle1Inputs */

const da_dashboardtitle1 = /** @type {(inputs: Dashboardtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oversigt`)
};

const en_dashboardtitle1 = /** @type {(inputs: Dashboardtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Overview`)
};

const fr_dashboardtitle1 = /** @type {(inputs: Dashboardtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vue d'ensemble`)
};

/**
* | output |
* | --- |
* | "Overview" |
*
* @param {Dashboardtitle1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const dashboardtitle1 = /** @type {((inputs?: Dashboardtitle1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboardtitle1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_dashboardtitle1(inputs)
	if (locale === "en") return en_dashboardtitle1(inputs)
	return fr_dashboardtitle1(inputs)
});
export { dashboardtitle1 as "dashboardTitle" }