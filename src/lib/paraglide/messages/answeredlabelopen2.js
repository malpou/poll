/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ total: NonNullable<unknown> }} Answeredlabelopen2Inputs */

const da_answeredlabelopen2 = /** @type {(inputs: Answeredlabelopen2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.total} har svaret`)
};

const en_answeredlabelopen2 = /** @type {(inputs: Answeredlabelopen2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.total} answered`)
};

const fr_answeredlabelopen2 = /** @type {(inputs: Answeredlabelopen2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.total} ont répondu`)
};

/**
* | output |
* | --- |
* | "{total} answered" |
*
* @param {Answeredlabelopen2Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const answeredlabelopen2 = /** @type {((inputs: Answeredlabelopen2Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Answeredlabelopen2Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_answeredlabelopen2(inputs)
	if (locale === "en") return en_answeredlabelopen2(inputs)
	return fr_answeredlabelopen2(inputs)
});
export { answeredlabelopen2 as "answeredLabelOpen" }