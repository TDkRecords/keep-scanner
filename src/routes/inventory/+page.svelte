<script>
	import { onMount } from 'svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { createToast } from '$lib/toast.svelte.js';
	import { deleteProduct, fetchProducts, updateProduct } from '$lib/products.js';
	import { formatCurrency } from '$lib/format.js';

	const toast = createToast();

	let products = $state([]);
	let loading = $state(true);
	let search = $state('');
	let editingId = $state(null);
	let editBarcode = $state('');
	let editName = $state('');
	let editQuantity = $state(0);
	let editPrice = $state('');
	let saving = $state(false);
	let deletingId = $state(null);

	const filtered = $derived(
		search.trim() === ''
			? products
			: products.filter(
					(p) =>
						p.name.toLowerCase().includes(search.toLowerCase()) ||
						(p.barcode ?? '').includes(search)
				)
	);

	onMount(loadProducts);

	async function loadProducts() {
		loading = true;
		try {
			products = await fetchProducts();
		} catch {
			toast.error('No se pudo cargar el inventario');
		} finally {
			loading = false;
		}
	}

	function startEdit(product) {
		editingId = product.id;
		editBarcode = product.barcode ?? '';
		editName = product.name;
		editQuantity = product.quantity;
		editPrice = String(product.price);
	}

	function cancelEdit() {
		editingId = null;
	}

	async function handleUpdate() {
		if (!editName.trim()) {
			toast.error('El nombre es obligatorio');
			return;
		}

		saving = true;
		try {
			await updateProduct(editingId, {
				barcode: editBarcode || null,
				name: editName,
				quantity: Number(editQuantity),
				price: Number(editPrice)
			});
			toast.success('Producto actualizado');
			editingId = null;
			await loadProducts();
		} catch {
			toast.error('No se pudo actualizar');
		} finally {
			saving = false;
		}
	}

	async function handleDelete(id) {
		if (!confirm('¿Eliminar este producto del inventario?')) return;

		deletingId = id;
		try {
			await deleteProduct(id);
			toast.success('Producto eliminado');
			if (editingId === id) editingId = null;
			await loadProducts();
		} catch {
			toast.error('No se pudo eliminar');
		} finally {
			deletingId = null;
		}
	}
</script>

<PageHeader
	title="Inventario"
	subtitle="{products.length} producto{products.length === 1 ? '' : 's'}"
	backHref="/"
/>

<Toast message={toast.message} type={toast.type} visible={toast.visible} />

<div class="flex flex-col gap-4">
	<div class="relative">
		<i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
		<input
			bind:value={search}
			placeholder="Buscar por nombre o código..."
			class="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50"
		/>
	</div>

	{#if loading}
		<div class="flex flex-col items-center gap-3 py-16 text-white/40">
			<i class="fa-solid fa-spinner fa-spin text-2xl"></i>
			<p class="text-sm">Cargando inventario...</p>
		</div>
	{:else if filtered.length === 0}
		<GlassCard class="py-12 text-center">
			<i class="fa-solid fa-box-open text-3xl text-white/20"></i>
			<p class="mt-3 text-white/50">
				{search ? 'Sin resultados' : 'No hay productos registrados'}
			</p>
			{#if !search}
				<a href="/register" class="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300">
					<i class="fa-solid fa-plus mr-1"></i> Registrar producto
				</a>
			{/if}
		</GlassCard>
	{:else}
		<div class="flex flex-col gap-3">
			{#each filtered as product (product.id)}
				<GlassCard>
					{#if editingId === product.id}
						<div class="flex flex-col gap-3">
							<input
								bind:value={editBarcode}
								placeholder="Código de barras"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
							/>
							<input
								bind:value={editName}
								placeholder="Nombre"
								class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
							/>
							<div class="grid grid-cols-2 gap-2">
								<input
									bind:value={editQuantity}
									type="number"
									min="0"
									placeholder="Stock"
									class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
								/>
								<input
									bind:value={editPrice}
									type="number"
									min="0"
									placeholder="Precio"
									class="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
								/>
							</div>
							<div class="flex gap-2">
								<button
									type="button"
									onclick={handleUpdate}
									disabled={saving}
									class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
								>
									<i class="fa-solid {saving ? 'fa-spinner fa-spin' : 'fa-check'}"></i>
									Guardar
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
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 flex-1">
								<h3 class="truncate font-semibold text-white">{product.name}</h3>
								<p class="mt-0.5 text-xs text-white/40">
									{product.barcode ?? 'Sin código'}
								</p>
								<div class="mt-2 flex flex-wrap gap-2">
									<span
										class="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs text-white/60"
									>
										<i class="fa-solid fa-cubes"></i>
										{product.quantity} uds.
									</span>
									<span
										class="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300"
									>
										{formatCurrency(Number(product.price))}
									</span>
								</div>
							</div>
							<div class="flex shrink-0 gap-1.5">
								<button
									type="button"
									onclick={() => startEdit(product)}
									class="flex size-9 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white"
									aria-label="Editar"
								>
									<i class="fa-solid fa-pen text-sm"></i>
								</button>
								<button
									type="button"
									onclick={() => handleDelete(product.id)}
									disabled={deletingId === product.id}
									class="flex size-9 items-center justify-center rounded-xl border border-rose-500/20 text-rose-400/70 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
									aria-label="Eliminar"
								>
									<i
										class="fa-solid {deletingId === product.id
											? 'fa-spinner fa-spin'
											: 'fa-trash'} text-sm"
									></i>
								</button>
							</div>
						</div>
					{/if}
				</GlassCard>
			{/each}
		</div>
	{/if}
</div>
