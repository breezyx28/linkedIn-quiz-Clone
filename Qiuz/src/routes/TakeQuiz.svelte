<script>
	import Answer from '../components/answers/answers.svelte';
	import db from '../API/stages.json';

	let answers = [
		{
			id: 1,
			text: 'answer 1',
			selected: false
		},
		{
			id: 2,
			text: 'answer 2',
			selected: false
		},
		{
			id: 3,
			text: 'answer 3',
			selected: false
		},
		{
			id: 4,
			text: 'answer 4',
			selected: false
		}
	];

	// next question
	let current_stage = 0;
	// time bar
	let percentage = 0;
	let count = 1;

	$: {
		current_stage;
		if (percentage === 100) {
			console.log(percentage);
			clearInterval(timeCounter);
		}
	}

	let nextQuestion = (index) => {
		return db.details[index];
	};

	$: {
		if (current_stage) {
			nextQuestion(current_stage);
		}
	}

	let timeCounter = setInterval(() => {
		// calc pecentage of progress
		count = count + 1;
		percentage = (count / db.quizTime) * 100;
	}, 100);

	console.log(db);

	let noAnswers = true;
	let answerClicked = null;

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

	$: {
		noAnswers, answerClicked;
		console.log(answerClicked);
	}
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
				<div class="pl-4" style="background-color: #F9FAFB;">
					<div class="questions flex flex-col divide-y divide-gray-300">
						<!-- answers -->
						{#each nextQuestion(current_stage)?.answers as answer}
							<Answer clicked={answerClicked} data={answer} on:selectedAnswer={handleAnswer} />
						{/each}
					</div>
				</div>
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
							<span class="pl-4">01:10</span>
						</div>
						<div class="button">
							<button
								class="rounded-full py-1 px-4"
								type="button"
								style="background-color: {noAnswers ? '#F3F2EF' : '#0075AF'};color:{noAnswers
									? '#56687A'
									: 'white'};cursor:{noAnswers ? 'default' : 'pointer'};transition:0.4s"
								on:click={() => {
									current_stage = current_stage + 1;
									answerClicked = null;
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
