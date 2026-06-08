<script>
	let { message = '', type = 'info', visible = false } = $props();

	const colors = {
		info: 'border-indigo-400/30 bg-indigo-500/20 text-indigo-200',
		success: 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200',
		error: 'border-rose-400/30 bg-rose-500/20 text-rose-200'
	};

	const icons = {
		info: 'fa-circle-info',
		success: 'fa-circle-check',
		error: 'fa-circle-exclamation'
	};
</script>

{#if visible && message}
	<div
		class="fixed left-4 right-4 top-4 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl {colors[
			type
		] ?? colors.info}"
		role="alert"
	>
		<i class="fa-solid {icons[type] ?? icons.info}"></i>
		<p class="text-sm font-medium">{message}</p>
	</div>
{/if}
