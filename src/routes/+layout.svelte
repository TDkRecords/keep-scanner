<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import BottomNav from '$lib/components/BottomNav.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Keep Scanner</title>
</svelte:head>

<div class="relative min-h-dvh font-sans">
	<main class="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
		{@render children()}
	</main>
	<BottomNav />
</div>
