<script>
	let { title, subtitle = '', backHref = '/' } = $props();
</script>

<header class="mb-6 flex items-start gap-3">
	<a
		href={backHref}
		class="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
		aria-label="Volver"
	>
		<i class="fa-solid fa-arrow-left"></i>
	</a>
	<div class="min-w-0 flex-1">
		<h1 class="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
		{#if subtitle}
			<p class="mt-1 text-sm text-white/50">{subtitle}</p>
		{/if}
	</div>
</header>
