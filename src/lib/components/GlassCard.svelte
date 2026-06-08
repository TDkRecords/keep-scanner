<script>
	let { children, class: className = '', padding = true } = $props();
</script>

<div
	class="rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-xl {padding
		? 'p-4'
		: ''} {className}"
>
	{@render children()}
</div>
