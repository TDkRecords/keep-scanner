import { supabase } from './supabase.js';
import { adjustStock, fetchProducts } from './products.js';

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

export async function fetchSales() {
	const { data, error } = await supabase
		.from('sales')
		.select('*, sale_items(*)')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data ?? [];
}

/** @param {string} saleId */
export async function deleteSale(saleId) {
	const { data: items, error: fetchError } = await supabase
		.from('sale_items')
		.select('*')
		.eq('sale_id', saleId);

	if (fetchError) throw fetchError;

	for (const item of items ?? []) {
		if (item.product_id) {
			await adjustStock(item.product_id, item.quantity);
		}
	}

	const { error } = await supabase.from('sales').delete().eq('id', saleId);
	if (error) throw error;
}

/**
 * @param {Array<{ product_id?: string | null, quantity: number }>} newItems
 * @param {Array<{ product_id?: string | null, quantity: number }>} oldItems
 * @param {Record<string, number>} stockMap
 */
function validateStockForUpdate(newItems, oldItems, stockMap) {
	for (const item of newItems) {
		if (!item.product_id) continue;

		const oldQty = oldItems
			.filter((o) => o.product_id === item.product_id)
			.reduce((sum, o) => sum + o.quantity, 0);

		const available = (stockMap[item.product_id] ?? 0) + oldQty;

		if (item.quantity > available) {
			throw new Error('STOCK_INSUFFICIENT');
		}
	}
}

/**
 * @param {string} saleId
 * @param {Array<{
 *   product_id?: string | null,
 *   product_name: string,
 *   barcode?: string | null,
 *   quantity: number,
 *   unit_price: number
 * }>} items
 */
export async function updateSale(saleId, items) {
	if (items.length === 0) {
		throw new Error('EMPTY_SALE');
	}

	const { data: oldItems, error: fetchError } = await supabase
		.from('sale_items')
		.select('*')
		.eq('sale_id', saleId);

	if (fetchError) throw fetchError;

	const products = await fetchProducts();
	const stockMap = Object.fromEntries(products.map((p) => [p.id, p.quantity]));

	validateStockForUpdate(items, oldItems ?? [], stockMap);

	for (const item of oldItems ?? []) {
		if (item.product_id) {
			await adjustStock(item.product_id, item.quantity);
		}
	}

	const { error: deleteError } = await supabase.from('sale_items').delete().eq('sale_id', saleId);
	if (deleteError) throw deleteError;

	const saleItems = items.map((item) => ({
		sale_id: saleId,
		product_id: item.product_id ?? null,
		product_name: item.product_name,
		barcode: item.barcode ?? null,
		quantity: item.quantity,
		unit_price: item.unit_price,
		subtotal: item.unit_price * item.quantity
	}));

	const { error: insertError } = await supabase.from('sale_items').insert(saleItems);
	if (insertError) throw insertError;

	for (const item of items) {
		if (item.product_id) {
			await adjustStock(item.product_id, -item.quantity);
		}
	}

	const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
	const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

	const { data, error: updateError } = await supabase
		.from('sales')
		.update({ total, items_count: itemsCount })
		.eq('id', saleId)
		.select('*, sale_items(*)')
		.single();

	if (updateError) throw updateError;
	return data;
}
