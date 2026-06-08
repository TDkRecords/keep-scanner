import { supabase } from './supabase.js';
import { adjustStock } from './products.js';

/**
 * @param {Array<{
 *   id: string,
 *   name: string,
 *   barcode?: string | null,
 *   price: number,
 *   cantidad: number
 * }>} cartItems
 */
export async function registerSale(cartItems) {
	const total = cartItems.reduce((sum, item) => sum + item.price * item.cantidad, 0);
	const itemsCount = cartItems.reduce((sum, item) => sum + item.cantidad, 0);

	const { data: sale, error: saleError } = await supabase
		.from('sales')
		.insert({ total, items_count: itemsCount })
		.select()
		.single();

	if (saleError) throw saleError;

	const saleItems = cartItems.map((item) => ({
		sale_id: sale.id,
		product_id: item.id,
		product_name: item.name,
		barcode: item.barcode ?? null,
		quantity: item.cantidad,
		unit_price: item.price,
		subtotal: item.price * item.cantidad
	}));

	const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
	if (itemsError) throw itemsError;

	for (const item of cartItems) {
		await adjustStock(item.id, -item.cantidad);
	}

	return sale;
}
