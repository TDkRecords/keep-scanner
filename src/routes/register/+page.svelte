<script>
	import { onMount } from 'svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { createToast } from '$lib/toast.svelte.js';
	import { createProduct, fetchProducts } from '$lib/products.js';
	import { scanBarcode } from '$lib/scanner.js';
	import { formatCurrency } from '$lib/format.js';

	const toast = createToast();

	let barcode = $state('');
	let name = $state('');
	let quantity = $state(1);
	let price = $state('');
	let saving = $state(false);
	let scanning = $state(false);
	let recentProducts = $state([]);

	onMount(loadRecent);

	async function loadRecent() {
		try {
			const data = await fetchProducts();
			recentProducts = data.slice(-5).reverse();
		} catch {
			/* silencioso en carga inicial */
		}
	}

	async function handleScan() {
		scanning = true;
		try {
			const code = await scanBarcode();
			if (code) barcode = code;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Error al escanear');
		} finally {
			scanning = false;
		}
	}

	async function handleSave() {
		if (!name.trim()) {
			toast.error('Ingresa el nombre del producto');
			return;
		}
		if (!price || Number(price) < 0) {
			toast.error('Ingresa un precio válido');
			return;
		}
		if (Number(quantity) < 1) {
			toast.error('La cantidad debe ser al menos 1');
			return;
		}

		saving = true;
		try {
			await createProduct({
				barcode: barcode || null,
				name,
				quantity: Number(quantity),
				price: Number(price)
			});

			toast.success('Producto registrado');
			barcode = '';
			name = '';
			quantity = 1;
			price = '';
			await loadRecent();
		} catch (err) {
			const msg = err?.message?.includes('duplicate')
				? 'Ya existe un producto con ese código de barras'
				: 'No se pudo guardar el producto';
			toast.error(msg);
		} finally {
			saving = false;
		}
	}
</script>

<PageHeader
	title="Registrar producto"
	subtitle="Manual o con código de barras"
	backHref="/"
/>

<Toast message={toast.message} type={toast.type} visible={toast.visible} />

<div class="flex flex-col gap-4">
	<GlassCard>
		<button
			type="button"
			onclick={handleScan}
			disabled={scanning}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/20 px-4 py-3 font-medium text-indigo-300 transition hover:bg-indigo-500/30 disabled:opacity-50"
		>
			<i class="fa-solid {scanning ? 'fa-spinner fa-spin' : 'fa-camera'}"></i>
			{scanning ? 'Escaneando...' : 'Escanear código'}
		</button>

		<div class="mt-4 flex flex-col gap-3">
			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-white/50">Código de barras</span>
				<input
					bind:value={barcode}
					placeholder="Opcional"
					class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50"
				/>
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-white/50">Nombre *</span>
				<input
					bind:value={name}
					placeholder="Ej. Coca Cola 350ml"
					class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50"
				/>
			</label>

			<div class="grid grid-cols-2 gap-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-white/50">Cantidad</span>
					<input
						bind:value={quantity}
						type="number"
						min="1"
						class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-indigo-400/50"
					/>
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-white/50">Precio *</span>
					<input
						bind:value={price}
						type="number"
						min="0"
						step="1"
						placeholder="0"
						class="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-indigo-400/50"
					/>
				</label>
			</div>
		</div>

		<button
			type="button"
			onclick={handleSave}
			disabled={saving}
			class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
		>
			<i class="fa-solid {saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}"></i>
			{saving ? 'Guardando...' : 'Guardar producto'}
		</button>
	</GlassCard>

	{#if recentProducts.length > 0}
		<div>
			<h2 class="mb-3 text-sm font-medium text-white/50">Últimos registrados</h2>
			<div class="flex flex-col gap-2">
				{#each recentProducts as product}
					<GlassCard padding={false} class="px-4 py-3">
						<div class="flex items-center justify-between gap-3">
							<div class="min-w-0">
								<p class="truncate font-medium text-white">{product.name}</p>
								<p class="text-xs text-white/40">
									{product.barcode ?? 'Sin código'} · Stock: {product.quantity}
								</p>
							</div>
							<span class="shrink-0 text-sm font-semibold text-indigo-300">
								{formatCurrency(Number(product.price))}
							</span>
						</div>
					</GlassCard>
				{/each}
			</div>
		</div>
	{/if}
</div>
