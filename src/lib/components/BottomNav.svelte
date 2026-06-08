<script>
	import { page } from '$app/stores';

	const links = [
		{ href: '/', icon: 'fa-house', label: 'Inicio' },
		{ href: '/register', icon: 'fa-plus', label: 'Registrar' },
		{ href: '/inventory', icon: 'fa-boxes-stacked', label: 'Inventario' },
		{ href: '/sales', icon: 'fa-cash-register', label: 'Ventas' }
	];

	function isActive(href, pathname) {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0d0d18]/80 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"
>
	<div class="mx-auto flex max-w-lg items-center justify-around">
		{#each links as link}
			{@const active = isActive(link.href, $page.url.pathname)}
			<a
				href={link.href}
				class="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs transition {active
					? 'text-indigo-400'
					: 'text-white/40 hover:text-white/70'}"
			>
				<span
					class="flex size-9 items-center justify-center rounded-xl transition {active
						? 'bg-indigo-500/20 text-indigo-400'
						: ''}"
				>
					<i class="fa-solid {link.icon} text-base"></i>
				</span>
				<span class="truncate font-medium">{link.label}</span>
			</a>
		{/each}
	</div>
</nav>
