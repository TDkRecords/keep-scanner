import { supabase } from './supabase.js';

export async function fetchProducts() {
	const { data, error } = await supabase
		.from('products')
		.select('*')
		.order('name', { ascending: true });

	if (error) throw error;
	return data ?? [];
}

export async function fetchProductByBarcode(barcode) {
	const { data, error } = await supabase
		.from('products')
		.select('*')
		.eq('barcode', barcode)
		.maybeSingle();

	if (error) throw error;
	return data;
}

export async function searchProducts(query) {
	const term = query.trim();
	if (!term) return [];

	const { data, error } = await supabase
		.from('products')
		.select('*')
		.or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
		.order('name', { ascending: true })
		.limit(10);

	if (error) throw error;
	return data ?? [];
}

/** @param {{ barcode?: string | null, name: string, quantity: number, price: number }} product */
export async function createProduct(product) {
	const payload = {
		barcode: product.barcode?.trim() || null,
		name: product.name.trim(),
		quantity: product.quantity,
		price: product.price,
		updated_at: new Date().toISOString()
	};

	const { data, error } = await supabase.from('products').insert(payload).select().single();

	if (error) throw error;
	return data;
}

/** @param {string} id @param {{ barcode?: string | null, name: string, quantity: number, price: number }} product */
export async function updateProduct(id, product) {
	const payload = {
		barcode: product.barcode?.trim() || null,
		name: product.name.trim(),
		quantity: product.quantity,
		price: product.price,
		updated_at: new Date().toISOString()
	};

	const { data, error } = await supabase
		.from('products')
		.update(payload)
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data;
}

/** @param {string} id */
export async function deleteProduct(id) {
	const { error } = await supabase.from('products').delete().eq('id', id);
	if (error) throw error;
}

/** @param {string} id @param {number} delta */
export async function adjustStock(id, delta) {
	const { data: product, error: fetchError } = await supabase
		.from('products')
		.select('quantity')
		.eq('id', id)
		.single();

	if (fetchError) throw fetchError;

	const newQty = Math.max(0, product.quantity + delta);

	const { error } = await supabase
		.from('products')
		.update({ quantity: newQty, updated_at: new Date().toISOString() })
		.eq('id', id);

	if (error) throw error;
	return newQty;
}
