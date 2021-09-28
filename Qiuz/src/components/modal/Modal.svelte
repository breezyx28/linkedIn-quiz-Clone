<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('closeModal', {
			open: false
		});
	}
</script>

<div class="modal relative bg-white text-dark rounded-lg">
	<div class="grid grid-rows-1 p-5">
		<div class="w-full">
			<div
				on:click={closeModal}
				id="modalClose"
				class="text-lg float-right ml-2 p-3 hover:p-3 rounded-full hover:bg-gray-400 hover:bg-opacity-25"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					data-supported-dps="24x24"
					fill="currentColor"
					class="text-gray-700"
					width="24"
					height="24"
					focusable="false"
				>
					<path
						d="M13.42 12L20 18.58 18.58 20 12 13.42 5.42 20 4 18.58 10.58 12 4 5.42 5.42 4 12 10.58 18.58 4 20 5.42z"
					/>
				</svg>
			</div>
		</div>
		<div class="grid grid-rows-1 gap-y-2 pb-4">
			<img
				src="img/AAYQAQSZAAgAAQAAAAAAABPIj0yNMKrJR96eOuPB_YDI0A.png"
				width="48"
				height="48"
				alt="CSS"
			/>
			<p class="font-semibold text-gray-800" style="font-size: large;">
				Cascading Style Sheets (CSS) Assessment
			</p>
			<small>
				Topics: Display Styles, Element Selectors, Functions and Rules, Page Layout, Syntax and
				Semantics
			</small>
			<small class="text-gray-400">1M people took this</small>
		</div>
		<div class="grid grid-rows-1 gap-y-2">
			<div class="flex items-center gap-x-2">
				<div class="icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						data-supported-dps="24x24"
						fill="currentColor"
						class="text-gray-600"
						width="24"
						height="24"
						focusable="false"
					>
						<path
							d="M7 4a2 2 0 11-2-2 2 2 0 012 2zm2-1v2h12V3zm-4 7a2 2 0 102 2 2 2 0 00-2-2zm4 3h12v-2H9zm-4 5a2 2 0 102 2 2 2 0 00-2-2zm4 3h12v-2H9z"
						/>
					</svg>
				</div>
				<div class="desc"><small><strong>15</strong> multiple choice questions</small></div>
			</div>
			<div class="flex items-center gap-x-2">
				<div class="icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						data-supported-dps="24x24"
						fill="currentColor"
						class="text-gray-600"
						width="24"
						height="24"
						focusable="false"
					>
						<g>
							<path d="M2 12A10 10 0 1012 2 10 10 0 002 12zm2 0a8 8 0 118 8 8 8 0 01-8-8z" />
							<path
								d="M15.1 12.63L13 11.42V7a1 1 0 00-2 0v5a1 1 0 00.51.85l2.59 1.52a1 1 0 101-1.74z"
							/>
						</g>
					</svg>
				</div>
				<div class="desc"><small><strong>1.5 minutes</strong> per question</small></div>
			</div>
			<div class="flex items-center gap-x-2">
				<div class="icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						data-supported-dps="24x24"
						fill="currentColor"
						class="text-gray-600"
						width="24"
						height="24"
						focusable="false"
					>
						<path
							d="M14.73 10H17l-5.5 8L8 14.5l1.34-1.34L11.21 15zM20 3v16a3 3 0 01-3 3H7a3 3 0 01-3-3V3h5.69l.52-1A2 2 0 0112 1a2 2 0 011.76 1l.52 1zm-2 2h-2.6l.6 1.1V7H8v-.9L8.6 5H6v14a1 1 0 001 1h10a1 1 0 001-1z"
						/>
					</svg>
				</div>
				<div class="desc"><small>Score in the top <strong>30</strong>% to earn a badge</small></div>
			</div>
		</div>

		<hr style="margin: 1.2rem 0;" />

		<p class="font-semibold text-gray-800" style="font-size: large;">Before you start</p>

		<div class="pl-5 mt-2">
			<ul class="rules list-disc">
				<li>
					You must complete this assessment in one session — make sure your internet is reliable.
				</li>
				<li>You can retake this assessment once if you don’t earn a badge.</li>
				<li>We won’t show your results to anyone without your permission.</li>
			</ul>
		</div>
	</div>
	<hr style="margin-bottom: 1.2rem;" />
	<div class="grid px-5 pb-5">
		<div
			id="footers"
			class="flex lg:flex-row flex-col lg:justify-between lg:items-center items-start"
		>
			<div class="footer-settings">
				<div id="footers-left" class="grid lg:grid-cols-2 sm:grid-rows">
					<div class="flex text-gray-700 text-sm pr-3">
						Accessibility mode:
						<span class="ml-1 font-semibold">Off </span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 16 16"
							data-supported-dps="16x16"
							fill="currentColor"
							class="ml-1"
							width="16"
							height="16"
							focusable="false"
						>
							<path d="M8 11L3 6h10z" fill-rule="evenodd" />
						</svg>
					</div>
					<div class="flex text-gray-700 text-sm lg:pl-3 lg:border-l lg:border-gray-900">
						Language: <span class="font-semibold ml-1">English</span>
					</div>
				</div>
			</div>
			<div class="footer-buttons">
				<div class="flex justify-between gap-3">
					<button id="take" class="ln-color rounded-full py-1 px-3 font-semibold">Practice</button>
					<a
						href="/"
						id="startBtn"
						class="rounded-full py-1 px-3 font-semibold text-white cursor-pointer">Start</a
					>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* :global(body) {
		z-index: -1;
		background-color: rgba(0, 0, 0, 0.7);
	} */

	:global(.modal) {
		z-index: 1;
		width: 55%;
		height: auto;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -55%);
	}
	@media only screen and (max-width: 600px) {
		:global(.modal) {
			overflow-y: scroll;
			z-index: 1;
			width: 100%;
			height: 90%;
			position: absolute;
			bottom: 0;
			transform: translate(-50%, -50%);
		}
		#footers {
			row-gap: 1rem;
		}
		#footers-left {
			row-gap: 1rem;
		}
	}
	.rules > li {
		padding: 0.25rem 0;
		font-size: 14px;
	}
	.ln-color {
		color: #2867b2;
	}
	.ln-bg {
		background-color: rgb(40, 103, 178);
	}
	#take {
		border: 1px solid #2867b2;
		position: relative;
	}
	#take:hover {
		border: 2px solid #2867b2;
		background-color: rgba(40, 103, 178, 0.1);
	}
	#startBtn {
		background-color: rgb(10 102 194);
	}
	#startBtn:hover {
		background-color: rgb(0, 65, 130);
	}
</style>
