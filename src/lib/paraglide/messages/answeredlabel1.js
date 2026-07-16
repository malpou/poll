/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ total: NonNullable<unknown>, totalInvitees: NonNullable<unknown> }} Answeredlabel1Inputs */

const da_answeredlabel1 = /** @type {(inputs: Answeredlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.total} af ${i?.totalInvitees} har svaret`)
};

const en_answeredlabel1 = /** @type {(inputs: Answeredlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.total} of ${i?.totalInvitees} answered`)
};

const fr_answeredlabel1 = /** @type {(inputs: Answeredlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.total} sur ${i?.totalInvitees} ont répondu`)
};

/**
* | output |
* | --- |
* | "{total} of {totalInvitees} answered" |
*
* @param {Answeredlabel1Inputs} inputs
* @param {{ locale?: "da" | "en" | "fr" }} options
* @returns {LocalizedString}
*/
const answeredlabel1 = /** @type {((inputs: Answeredlabel1Inputs, options?: { locale?: "da" | "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Answeredlabel1Inputs, { locale?: "da" | "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "da") return da_answeredlabel1(inputs)
	if (locale === "en") return en_answeredlabel1(inputs)
	return fr_answeredlabel1(inputs)
});
export { answeredlabel1 as "answeredLabel" }