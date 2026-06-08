<script>
	import { onMount } from 'svelte';
	import GlassCard from '$lib/components/GlassCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { createToast } from '$lib/toast.svelte.js';
	import { fetchProductByBarcode, fetchProducts, searchProducts } from '$lib/products.js';
	import { registerSale } from '$lib/sales.js';
	import { scanBarcode } from '$lib/scanner.js';
	import { formatCurrency } from '$lib/format.js';

	const toast = createToast();

	/** @type {Array<{ id: string, name: string, barcode?: string | null, price: number, cantidad: number, stock: number }>} */
	let cart = $state([]);
	let search = $state('');
	let results = $state([]);
	let scanning = $state(false);
	let checkingOut = $state(false);
	let searching = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let searchTimer;

	const total = $derived(cart.reduce((sum, item) => sum + item.price * item.cantidad, 0));
	const totalUnits = $derived(cart.reduce((sum, item) => sum + item.cantidad, 0));

	onMount(() => {
		return () => {
			if (searchTimer) clearTimeout(searchTimer);
		};
	});

	function addToCart(product) {
		if (product.quantity <= 0) {
			toast.error('Sin stock disponible');
			return;
		}

		const existing = cart.find((item) => item.id === product.id);

		if (existing) {
			if (existing.cantidad >= product.quantity) {
				toast.error('Stock insuficiente');
				return;
			}
			existing.cantidad++;
			cart = [...cart];
			return;
		}

		cart = [
			...cart,
			{
				id: product.id,
				name: product.name,
				barcode: product.barcode,
				price: Number(product.price),
				cantidad: 1,
				stock: product.quantity
			}
		];
		search = '';
		results = [];
	}

	async function handleSearch(value) {
		search = value;
		if (searchTimer) clearTimeout(searchTimer);

		if (!value.trim()) {
			results = [];
			return;
		}

		searchTimer = setTimeout(async () => {
			searching = true;
			try {
				results = await searchProducts(value);
			} catch {
				toast.error('Error al buscar');
			} finally {
				searching = false;
			}
		}, 300);
	}

	async function handleScan() {
		scanning = true;
		try {
			const code = await scanBarcode();
			if (!code) return;

			const product = await fetchProductByBarcode(code);
			if (!product) {
				toast.error('Producto no encontrado');
				return;
			}
			addToCart(product);
			toast.success(`${product.name} agregado`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Error al escanear');
		} finally {
			scanning = false;
		}
	}

	function increaseQty(id) {
		const item = cart.find((p) => p.id === id);
		if (!item) return;

		if (item.cantidad >= item.stock) {
			toast.error('Stock insuficiente');
			return;
		}

		item.cantidad++;
		cart = [...cart];
	}

	function decreaseQty(id) {
		const item = cart.find((p) => p.id === id);
		if (!item) return;

		if (item.cantidad <= 1) {
			removeFromCart(id);
			return;
		}

		item.cantidad--;
		cart = [...cart];
	}

	function removeFromCart(id) {
		cart = cart.filter((item) => item.id !== id);
	}

	function clearCart() {
		cart = [];
	}

	async function handleCheckout() {
		if (cart.length === 0) {
			toast.error('El carrito está vacío');
			return;
		}

		checkingOut = true;
		try {
			const freshProducts = await fetchProducts();
			const stockMap = Object.fromEntries(freshProducts.map((p) => [p.id, p.quantity]));

			for (const item of cart) {
				if ((stockMap[item.id] ?? 0) < item.cantidad) {
					toast.error(`Stock insuficiente: ${item.name}`);
					checkingOut = false;
					return;
				}
			}

			await registerSale(cart);
			toast.success(`Venta registrada: ${formatCurrency(total)}`);
			cart = [];
		} catch {
			toast.error('No se pudo registrar la venta');
		} finally {
			checkingOut = false;
		}
	}
</script>

<PageHeader title="Caja" subtitle="Busca o escanea productos" backHref="/" />

<Toast message={toast.message} type={toast.type} visible={toast.visible} />

<div class="flex flex-col gap-4">
	<GlassCard>
		<button
			type="button"
			onclick={handleScan}
			disabled={scanning}
			class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500/20 px-4 py-3 font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
		>
			<i class="fa-solid {scanning ? 'fa-spinner fa-spin' : 'fa-barcode'}"></i>
			{scanning ? 'Escaneando...' : 'Escanear producto'}
		</button>

		<div class="relative mt-3">
			<i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30"></i>
			<input
				value={search}
				oninput={(e) => handleSearch(e.currentTarget.value)}
				placeholder="Buscar producto..."
				class="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50"
			/>
			{#if searching}
				<i
					class="fa-solid fa-spinner fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
				></i>
			{/if}
		</div>

		{#if results.length > 0}
			<div class="mt-2 overflow-hidden rounded-xl border border-white/10">
				{#each results as product}
					<button
						type="button"
						onclick={() => addToCart(product)}
						class="flex w-full items-center justify-between border-b border-white/5 px-4 py-3 text-left transition last:border-0 hover:bg-white/5"
					>
						<div class="min-w-0">
							<p class="truncate font-medium text-white">{product.name}</p>
							<p class="text-xs text-white/40">Stock: {product.quantity}</p>
						</div>
						<span class="shrink-0 text-sm text-emerald-300">
							{formatCurrency(Number(product.price))}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</GlassCard>

	<GlassCard>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="font-semibold text-white">
				<i class="fa-solid fa-cart-shopping mr-2 text-white/40"></i>
				Carrito
				<span class="ml-1 text-sm font-normal text-white/40">({cart.length})</span>
			</h2>
			{#if cart.length > 0}
				<button
					type="button"
					onclick={clearCart}
					class="text-xs text-white/40 hover:text-rose-400"
				>
					<i class="fa-solid fa-trash-can mr-1"></i> Vaciar
				</button>
			{/if}
		</div>

		{#if cart.length === 0}
			<div class="py-8 text-center text-white/30">
				<i class="fa-solid fa-basket-shopping text-3xl"></i>
				<p class="mt-2 text-sm">Agrega productos al carrito</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				{#each cart as item (item.id)}
					<div
						class="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
					>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-white">{item.name}</p>
							<p class="text-xs text-white/40">
								{formatCurrency(item.price)} c/u
							</p>
						</div>

						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => decreaseQty(item.id)}
								aria-label="Disminuir cantidad"
								class="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10"
							>
								<i class="fa-solid fa-minus text-xs"></i>
							</button>
							<span class="w-6 text-center text-sm font-bold text-white">
								{item.cantidad}
							</span>
							<button
								type="button"
								onclick={() => increaseQty(item.id)}
								aria-label="Aumentar cantidad"
								class="flex size-8 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10"
							>
								<i class="fa-solid fa-plus text-xs"></i>
							</button>
						</div>

						<div class="text-right">
							<p class="text-sm font-semibold text-white">
								{formatCurrency(item.price * item.cantidad)}
							</p>
							<button
								type="button"
								onclick={() => removeFromCart(item.id)}
								aria-label="Quitar del carrito"
								class="text-xs text-white/30 hover:text-rose-400"
							>
								<i class="fa-solid fa-xmark"></i>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</GlassCard>

	{#if cart.length > 0}
		<GlassCard class="bg-linear-to-br from-emerald-500/10 to-indigo-500/5">
			<div class="flex items-center justify-between text-sm text-white/50">
				<span>{totalUnits} unidad{totalUnits === 1 ? '' : 'es'}</span>
				<span>{cart.length} producto{cart.length === 1 ? '' : 's'}</span>
			</div>
			<div class="mt-2 flex items-end justify-between">
				<span class="text-sm text-white/50">Total</span>
				<span class="text-2xl font-bold text-white">{formatCurrency(total)}</span>
			</div>
			<button
				type="button"
				onclick={handleCheckout}
				disabled={checkingOut}
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
			>
				<i class="fa-solid {checkingOut ? 'fa-spinner fa-spin' : 'fa-receipt'}"></i>
				{checkingOut ? 'Procesando...' : 'Registrar venta'}
			</button>
		</GlassCard>
	{/if}
</div>
