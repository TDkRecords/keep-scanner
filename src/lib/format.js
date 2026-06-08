/** @param {number} value */
export function formatCurrency(value) {
	return new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

/** @param {string} iso */
export function formatDate(iso) {
	return new Intl.DateTimeFormat('es-CO', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(iso));
}
