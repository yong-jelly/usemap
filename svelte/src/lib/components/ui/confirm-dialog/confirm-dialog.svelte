<script lang="ts">
	import { fly } from 'svelte/transition';

	let {
		open = $bindable(false),
		title = '확인',
		description = '이 작업을 계속하시겠습니까?',
		confirmText = '확인',
		cancelText = '취소',
		confirmVariant = 'default', // 'default' | 'destructive'
		onConfirm,
		onCancel,
	}: {
		open?: boolean;
		title?: string;
		description?: string;
		confirmText?: string;
		cancelText?: string;
		confirmVariant?: 'default' | 'destructive';
		onConfirm?: () => void;
		onCancel?: () => void;
	} = $props();

	function handleCancel() {
		open = false;
		onCancel?.();
	}

	function handleConfirm() {
		open = false;
		onConfirm?.();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		transition:fly={{ y: 20, duration: 200 }}
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="dialog-title"
		aria-describedby="dialog-description"
	>
		<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-lg">
			<div class="p-6">
				<h3 id="dialog-title" class="mb-2 text-lg font-semibold text-gray-900">
					{title}
				</h3>
				<p id="dialog-description" class="mb-6 text-sm text-gray-600">
					{description}
				</p>
				<div class="flex justify-end gap-3">
					<button
						class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
						onclick={handleCancel}
					>
						{cancelText}
					</button>
					<button
						class="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors {confirmVariant ===
						'destructive'
							? 'bg-red-600 hover:bg-red-700'
							: 'bg-blue-600 hover:bg-blue-700'}"
						onclick={handleConfirm}
					>
						{confirmText}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
