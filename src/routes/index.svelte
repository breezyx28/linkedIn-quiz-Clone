<script>
	import { fade, fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import Modal from '../components/modal/Modal.svelte';

	let openModal = false;

	// change modal state
	function handleModal() {
		openModal = !openModal;
	}

	function handleColseModal(e) {
		openModal = e.detail.open;
	}

	$: {
		openModal;
	}
</script>

<div class="w-screen h-screen">
	<div class="flex justify-center items-center h-full">
		<button on:click={handleModal} id="take" class="ln-color rounded-full py-2 px-3 font-semibold"
			>Take skill quiz</button
		>
	</div>
</div>

{#if openModal}
	<div
		class="absolute top-0 left-0 w-full h-full z-0 bg-gray-800 bg-opacity-70"
		in:fade
		out:fade={{ x: 100 }}
	>
		<Modal open={openModal} on:closeModal={handleColseModal} />
	</div>
{/if}

<style>
	.ln-color {
		color: #2867b2;
	}
	.ln-bg {
		background-color: rgb(40, 103, 178);
	}
	#take {
		border: 1px solid #2867b2;
	}
	#take:hover {
		border: 2px solid #2867b2;
		background-color: rgba(40, 103, 178, 0.1);
	}
</style>
