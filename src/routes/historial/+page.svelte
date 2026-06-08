<script>
	import { onMount } from 'svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { createToast } from '$lib/toast.svelte.js';
	import { deleteSale, fetchSales, updateSale } from '$lib/sales.js';
	import { searchProducts } from '$lib/products.js';
	import { formatCurrency, formatDate } from '$lib/format.js';

	const toast = createToast();

	let sales = $state([]);
	let loading = $state(true);
	let expandedId = $state(null);
	let editingId = $state(null);
	/** @type {Array<{ product_id?: string | null, product_name: string, barcode?: string | null, quantity: number, unit_price: number }>} */
	let editItems = $state([]);
	let saving = $state(false);
	let deletingId = $state(null);
	let search = $state('');
	let searchResults = $state([]);
	let searching = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let searchTimer;

	const editTotal = $derived(
		editItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
	);

	onMount(() => {
		loadSales();
		return () => {
			if (searchTimer) clearTimeout(searchTimer);
		};
	});

	async function loadSales() {
		loading = true;
		try {
			sales = await fetchSales();
		} catch {
			toast.error('No se pudo cargar el historial');
		} finally {
			loading = false;
		}
	}

	function toggleExpand(id) {
		if (editingId) return;
		expandedId = expandedId === id ? null : id;
	}

	function startEdit(sale) {
		expandedId = sale.id;
		editingId = sale.id;
		editItems = (sale.sale_items ?? []).map((item) => ({
			product_id: item.product_id,
			product_name: item.product_name,
			barcode: item.barcode,
			quantity: item.quantity,
			unit_price: Number(item.unit_price)
		}));
		search = '';
		searchResults = [];
	}

	function cancelEdit() {
		editingId = null;
		editItems = [];
		search = '';
		searchResults = [];
	}

	function handleSearch(value) {
		search = value;
		if (searchTimer) clearTimeout(searchTimer);

		if (!value.trim()) {
			searchResults = [];
			return;
		}

		searchTimer = setTimeout(async () => {
			searching = true;
			try {
				searchResults = await searchProducts(value);
			} catch {
				toast.error('Error al buscar');
			} finally {
				searching = false;
			}
		}, 300);
	}

	function addProductToEdit(product) {
		const existing = editItems.find((i) => i.product_id === product.id);

		if (existing) {
			existing.quantity++;
			editItems = [...editItems];
		} else {
			editItems = [
				...editItems,
				{
					product_id: product.id,
					product_name: product.name,
					barcode: product.barcode,
					quantity: 1,
					unit_price: Number(product.price)
				}
			];
		}

		search = '';
		searchResults = [];
	}

	function changeQty(index, delta) {
		const item = editItems[index];
		const newQty = item.quantity + delta;

		if (newQty <= 0) {
			editItems = editItems.filter((_, i) => i !== index);
			return;
		}

		item.quantity = newQty;
		editItems = [...editItems];
	}

	function removeEditItem(index) {
		editItems = editItems.filter((_, i) => i !== index);
	}

	async function handleSave() {
		if (editItems.length === 0) {
			toast.error('La venta debe tener al menos un producto');
			return;
		}

		saving = true;
		try {
			await updateSale(editingId, editItems);
			toast.success('Venta actualizada');
			editingId = null;
			editItems = [];
			await loadSales();
		} catch (err) {
			if (err instanceof Error && err.message === 'STOCK_INSUFFICIENT') {
				toast.error('Stock insuficiente para uno o más productos');
			} else {
				toast.error('No se pudo actualizar la venta');
			}
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id) {
		if (!confirm('¿Eliminar esta venta? El stock de los productos será restaurado.')) return;

		deletingId = id;
		try {
			await deleteSale(id);
			toast.success('Venta eliminada');
			if (expandedId === id) expandedId = null;
			if (editingId === id) cancelEdit();
			await loadSales();
		} catch {
			toast.error('No se pudo eliminar la venta');
		} finally {
			deletingId = null;
		}
	}
</script>

<PageHeader
	title="Historial"
	subtitle="{sales.length} venta{sales.length === 1 ? '' : 's'} registrada{sales.length === 1 ? '' : 's'}"
	backHref="/"
/>

<Toast message={toast.message} type={toast.type} visible={toast.visible} />

{#if loading}
	<div class="flex flex-col items-center gap-3 py-16 text-white/40">
		<i class="fa-solid fa-spinner fa-spin text-2xl"></i>
		<p class="text-sm">Cargando historial...</p>
	</div>
{:else if sales.length === 0}
	<GlassCard class="py-12 text-center">
		<i class="fa-solid fa-receipt text-3xl text-white/20"></i>
		<p class="mt-3 text-white/50">Aún no hay ventas registradas</p>
		<a href="/sales" class="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300">
			<i class="fa-solid fa-cash-register mr-1"></i> Ir a caja
		</a>
	</GlassCard>
{:else}
	<div class="flex flex-col gap-3">
		{#each sales as sale (sale.id)}
			<GlassCard padding={false} class="overflow-hidden">
				<button
					type="button"
					onclick={() => toggleExpand(sale.id)}
					class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
				>
					<span
						class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400"
					>
						<i class="fa-solid fa-receipt"></i>
					</span>
					<div class="min-w-0 flex-1">
						<p class="font-semibold text-white">{formatCurrency(Number(sale.total))}</p>
						<p class="text-xs text-white/40">
							{formatDate(sale.created_at)} · {sale.items_count} uds.
						</p>
					</div>
					<i
						class="fa-solid fa-chevron-down text-xs text-white/30 transition {expandedId === sale.id
							? 'rotate-180'
							: ''}"
					></i>
				</button>

				{#if expandedId === sale.id}
					<div class="border-t border-white/10 px-4 py-3">
						{#if editingId === sale.id}
							<div class="flex flex-col gap-3">
								<div class="relative">
									<i
										class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30"
									></i>
									<input
										value={search}
										oninput={(e) => handleSearch(e.currentTarget.value)}
										placeholder="Agregar producto..."
										class="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400/50"
									/>
								</div>

								{#if searchResults.length > 0}
									<div class="overflow-hidden rounded-xl border border-white/10">
										{#each searchResults as product}
											<button
												type="button"
												onclick={() => addProductToEdit(product)}
												class="flex w-full items-center justify-between border-b border-white/5 px-3 py-2.5 text-left text-sm last:border-0 hover:bg-white/5"
											>
												<span class="truncate text-white">{product.name}</span>
												<span class="shrink-0 text-xs text-amber-300">
													{formatCurrency(Number(product.price))}
												</span>
											</button>
										{/each}
									</div>
								{/if}

								<div class="flex flex-col gap-2">
									{#each editItems as item, index}
										<div
											class="rounded-xl border border-white/5 bg-white/[0.02] p-3"
										>
											<div class="flex items-start justify-between gap-2">
												<p class="text-sm font-medium text-white">
													{item.product_name}
												</p>
												<button
													type="button"
													onclick={() => removeEditItem(index)}
													aria-label="Quitar producto"
													class="text-white/30 hover:text-rose-400"
												>
													<i class="fa-solid fa-xmark text-xs"></i>
												</button>
											</div>

											<div class="mt-2 grid grid-cols-2 gap-2">
												<label class="flex flex-col gap-1">
													<span class="text-xs text-white/40">Cantidad</span>
													<div class="flex items-center gap-1">
														<button
															type="button"
															onclick={() => changeQty(index, -1)}
															aria-label="Disminuir"
															class="flex size-7 items-center justify-center rounded-lg border border-white/10 text-white/50"
														>
															<i class="fa-solid fa-minus text-[10px]"></i>
														</button>
														<span
															class="flex-1 text-center text-sm font-bold text-white"
														>
															{item.quantity}
														</span>
														<button
															type="button"
															onclick={() => changeQty(index, 1)}
															aria-label="Aumentar"
															class="flex size-7 items-center justify-center rounded-lg border border-white/10 text-white/50"
														>
															<i class="fa-solid fa-plus text-[10px]"></i>
														</button>
													</div>
												</label>
												<label class="flex flex-col gap-1">
													<span class="text-xs text-white/40">Precio unit.</span>
													<input
														type="number"
														min="0"
														bind:value={editItems[index].unit_price}
														class="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-amber-400/50"
													/>
												</label>
											</div>

											<p class="mt-2 text-right text-xs text-white/50">
												Subtotal: {formatCurrency(
													item.unit_price * item.quantity
												)}
											</p>
										</div>
									{/each}
								</div>

								<div class="flex items-center justify-between border-t border-white/10 pt-3">
									<span class="text-sm text-white/50">Nuevo total</span>
									<span class="text-lg font-bold text-white">
										{formatCurrency(editTotal)}
									</span>
								</div>

								<div class="flex gap-2">
									<button
										type="button"
										onclick={handleSave}
										disabled={saving}
										class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
									>
										<i class="fa-solid {saving ? 'fa-spinner fa-spin' : 'fa-check'}"></i>
										Guardar cambios
									</button>
									<button
										type="button"
										onclick={cancelEdit}
										class="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/5"
									>
										Cancelar
									</button>
								</div>
							</div>
						{:else}
							<div class="flex flex-col gap-2">
								{#each sale.sale_items ?? [] as item}
									<div
										class="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2 text-sm"
									>
										<div class="min-w-0">
											<p class="truncate text-white">{item.product_name}</p>
											<p class="text-xs text-white/40">
												{item.quantity} × {formatCurrency(Number(item.unit_price))}
											</p>
										</div>
										<span class="shrink-0 font-medium text-white/70">
											{formatCurrency(Number(item.subtotal))}
										</span>
									</div>
								{/each}
							</div>

							<div class="mt-3 flex gap-2">
								<button
									type="button"
									onclick={() => startEdit(sale)}
									class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 py-2.5 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
								>
									<i class="fa-solid fa-pen"></i>
									Editar
								</button>
								<button
									type="button"
									onclick={() => handleDelete(sale.id)}
									disabled={deletingId === sale.id}
									class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 py-2.5 text-sm text-rose-400/80 transition hover:bg-rose-500/10 disabled:opacity-50"
								>
									<i
										class="fa-solid {deletingId === sale.id
											? 'fa-spinner fa-spin'
											: 'fa-trash'}"
									></i>
									Eliminar
								</button>
							</div>
						{/if}
					</div>
				{/if}
			</GlassCard>
		{/each}
	</div>
{/if}
