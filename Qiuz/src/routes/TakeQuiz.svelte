<script>
	import Answer from '../components/answers/answers.svelte';
	import db from '../API/stages.json';
	import { fly } from 'svelte/transition';

	let current_stage = 0,
		percentage = 0,
		viewed = false,
		noAnswers = true,
		answerClicked = null,
		current_time,
		done = false,
		additionTime = 0,
		totalQuestions = db.details.length;

	$: {
		current_stage, current_time, done, additionTime;
	}

	// event to next question
	let nextQuestion = (index) => {
		progressCounter();
		return db.details[index];
	};

	// calc pecentage of progress
	let progressCounter = () => {
		percentage = (current_stage / totalQuestions) * 100;
	};

	progressCounter();

	// handle answer
	function handleAnswer(e) {
		noAnswers = false;
		let index = nextQuestion(current_stage).answers.findIndex((item) => item.id == e.detail.select);

		// set all selected to false
		nextQuestion(current_stage).answers = nextQuestion(current_stage).answers.map(
			(value, index) => {
				value.selected = false;
				return value;
			}
		);

		answerClicked = nextQuestion(current_stage).answers[index].id;
		nextQuestion(current_stage).answers[index].selected =
			!nextQuestion(current_stage).answers[index].selected;
	}

	let counter = {
		minutes: 0,
		secondes: 0
	};

	// countdown
	let countdown = () => {
		let minutes = Math.floor(current_time / 60);
		let secondes = current_time % 60;

		current_time = nextQuestion(current_stage)?.time;

		let intCountdown = setInterval(() => {
			// decreament by 1
			current_time = current_time - 1;

			// count down for minutes every 60 sec
			minutes = Math.floor(current_time / 60);
			secondes = current_time % 60;

			counter.minutes = minutes < 10 ? '0' + minutes : minutes;
			counter.secondes = secondes < 10 ? '0' + secondes : secondes;

			if (current_time == 0) {
				current_stage += 1;
				done = true;
				clearInterval(intCountdown);
				viewed = !viewed;
				noAnswers = true;
				countdown();
			}
		}, 1000);
	};

	$: {
		noAnswers, answerClicked, viewed, done;
	}

	countdown(nextQuestion(current_stage)?.time);
</script>

<div class="w-screen h-screen">
	<!-- outter container -->
	<div class="w-full h-full" style="background-color: #F3F2EF;" />

	<!-- inner conatainer -->
	<div class="wrapper absolute z-20">
		<div class="holder">
			<!-- header -->
			<div
				class="text-center text-white border-l border-r border-t border-gray-500 rounded-t-lg py-3"
				style="background-color:#666666"
			>
				<h1 class="text-xl text-gray-100 inline-block">{db.quizName}</h1>
			</div>
			<div class="border-l border-b border-r rounded-b-lg border-gray-300">
				<!-- question -->
				<div class="pl-4 border-b border-gray-300 bg-white py-4">
					<h6 class="text-md text-l font-normal text-gray-600">
						{nextQuestion(current_stage).question}
					</h6>
				</div>
				<!-- answers -->
				{#if viewed}
					<div
						id="answers-container"
						class="pl-4"
						style="background-color: #F9FAFB;"
						in:fly={{ duration: 750, opacity: 0 }}
					>
						<div class="questions flex flex-col divide-y divide-gray-300">
							<!-- answers -->
							{#each nextQuestion(current_stage)?.answers as answer}
								<Answer clicked={answerClicked} data={answer} on:selectedAnswer={handleAnswer} />
							{/each}
						</div>
					</div>
				{:else}
					<div
						id="answers-container"
						class="pl-4"
						style="background-color: #F9FAFB;"
						in:fly={{ duration: 750, opacity: 0 }}
					>
						<div class="questions flex flex-col divide-y divide-gray-300">
							<!-- answers -->
							{#each nextQuestion(current_stage)?.answers as answer}
								<Answer clicked={answerClicked} data={answer} on:selectedAnswer={handleAnswer} />
							{/each}
						</div>
					</div>
				{/if}
				<!-- feedback -->
				<div class="feedback pl-4 py-3 border-t border-gray-300" style="background-color: #F9FAFB;">
					<h6 class="text-sm text-gray-600">
						Something wrong with this question? <span class="font-semibold">Give feedback</span>
					</h6>
				</div>
				<!-- loading progress -->
				<div class="w-full h-3">
					<div class="relative">
						<div class="overflow-hidden h-3 text-xs flex bg-gray-300">
							<div
								style="width:{percentage}%;background-color:#56687A;"
								class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
							/>
						</div>
					</div>
				</div>
				<!-- next question -->
				<div class="next rounded-b-lg bg-white px-4 py-3">
					<div class="holder flex justify-between items-center">
						<div class="time text-gray-600">
							<span>Q {current_stage + 1}/{db.details.length}</span>
							<span class="pl-4">{counter.minutes}:{counter.secondes}</span>
						</div>
						<div class="button">
							<button
								class="rounded-full py-1 px-4"
								type="button"
								style="background-color: {noAnswers ? '#F3F2EF' : '#0075AF'};color:{noAnswers
									? '#56687A'
									: 'white'};cursor:{noAnswers ? 'default' : 'pointer'};transition:0.4s"
								on:click={() => {
									if (current_stage + 1 >= totalQuestions) {
										// navigate to results page
										window.location.href = '/results';
									}
									current_stage = current_stage + 1;
									answerClicked = null;
									viewed = !viewed;
									noAnswers = true;
								}}
							>
								Next
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.wrapper {
		width: 80%;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	@media (max-width: 768px) {
		.wrapper {
			width: 100% !important;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}
</style>
