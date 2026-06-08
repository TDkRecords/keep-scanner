export function createToast() {
	let message = $state('');
	let type = $state('info');
	let visible = $state(false);
	/** @type {ReturnType<typeof setTimeout> | undefined} */
	let timer;

	function show(msg, toastType = 'info', duration = 3000) {
		message = msg;
		type = toastType;
		visible = true;

		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			visible = false;
		}, duration);
	}

	return {
		get message() {
			return message;
		},
		get type() {
			return type;
		},
		get visible() {
			return visible;
		},
		show,
		success: (msg) => show(msg, 'success'),
		error: (msg) => show(msg, 'error'),
		info: (msg) => show(msg, 'info')
	};
}
