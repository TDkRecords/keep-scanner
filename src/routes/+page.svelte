<script>
	import GlassCard from '$lib/components/GlassCard.svelte';

	const menu = [
		{
			href: '/register',
			icon: 'fa-barcode',
			title: 'Registrar',
			desc: 'Agrega productos manual o con escáner',
			accent: 'from-indigo-500/20 to-violet-500/10',
			iconBg: 'bg-indigo-500/20 text-indigo-400'
		},
		{
			href: '/inventory',
			icon: 'fa-boxes-stacked',
			title: 'Inventario',
			desc: 'Consulta, edita y elimina productos',
			accent: 'from-cyan-500/20 to-blue-500/10',
			iconBg: 'bg-cyan-500/20 text-cyan-400'
		},
		{
			href: '/sales',
			icon: 'fa-cash-register',
			title: 'Ventas',
			desc: 'Caja registradora con escáner',
			accent: 'from-emerald-500/20 to-teal-500/10',
			iconBg: 'bg-emerald-500/20 text-emerald-400'
		},
		{
			href: '/historial',
			icon: 'fa-clock-rotate-left',
			title: 'Historial',
			desc: 'Consulta, edita o elimina ventas',
			accent: 'from-amber-500/20 to-orange-500/10',
			iconBg: 'bg-amber-500/20 text-amber-400'
		}
	];
</script>

<div class="flex min-h-[calc(100dvh-7rem)] flex-col justify-center gap-8 py-6">
	<div class="text-center">
		<div
			class="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
		>
			<i class="fa-solid fa-qrcode text-2xl text-indigo-400"></i>
		</div>
		<h1 class="text-3xl font-bold tracking-tight text-white">Keep Scanner</h1>
		<p class="mx-auto mt-2 max-w-xs text-sm text-white/50">
			Gestiona productos, inventario y ventas desde tu dispositivo
		</p>
	</div>

	<div class="flex flex-col gap-3">
		{#each menu as item}
			<a href={item.href} class="group block">
				<GlassCard
					class="bg-linear-to-br {item.accent} transition hover:border-white/20 hover:bg-white/10"
				>
					<div class="flex items-center gap-4">
						<span
							class="flex size-12 shrink-0 items-center justify-center rounded-xl {item.iconBg}"
						>
							<i class="fa-solid {item.icon} text-lg"></i>
						</span>
						<div class="min-w-0 flex-1 text-left">
							<h2 class="font-semibold text-white">{item.title}</h2>
							<p class="text-sm text-white/50">{item.desc}</p>
						</div>
						<i
							class="fa-solid fa-chevron-right text-sm text-white/30 transition group-hover:text-white/60"
						></i>
					</div>
				</GlassCard>
			</a>
		{/each}
	</div>
</div>
