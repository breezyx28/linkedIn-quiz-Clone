<script>
	import { createEventDispatcher } from 'svelte';

	export let data;
	export let clicked;

	console.log(data);
	let pressed = false;
	const dispatch = createEventDispatcher();

	function choose(d) {
		pressed = !pressed;
		dispatch('selectedAnswer', {
			select: d.id
		});
	}

	$: {
		data, pressed, clicked;
		console.log(clicked);
	}
</script>

<div class="flex align-center py-4" on:click={choose(data)}>
	<div class="relative rounded-full border border-gray-500" style="width:24px;height:24px;">
		<div class="answer-check {data?.id == clicked ? '' : 'hidden'}" />
	</div>
	<span class="pl-2 text-gray-600">{data?.text}</span>
</div>

<style>
	.answer-check {
		position: absolute;
		background-color: #0075af;
		border-radius: 50%;
		height: 70%;
		width: 70%;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}
</style>
