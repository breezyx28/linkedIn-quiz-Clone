<div class="w-screen h-screen">
	<!-- outter container -->
	<div class="w-full h-full">
		<div class="w-full" style="background-color:#6B8C9F;height:40%;" />
		<div class="w-full" style="background-color:#F5F5F5;height:60%;" />
	</div>

	<!-- inner conatainer -->
	<div class="wrapper absolute z-20">
		<div class="holder">
			<!-- header -->
			<div
				class="text-center text-white border-l border-r border-t border-gray-500 rounded-t-md py-3"
				style="background-color:#314347"
			>
				<h1 class="text-3xl">ArcGIS Products Assessment</h1>
			</div>
			<div class="border-l border-b border-r border-gray-300">
				<!-- question -->
				<div class="pl-4 border-b border-grey-500 bg-white py-3">
					<h6 class="font-semibold">
						What of these method is best of sharing a map with colleagues who do not have ArcMap or
						ArcGIS Pro?
					</h6>
				</div>
				<!-- answers -->
				<div class="pl-4" style="background-color: #F2F6F9;">
					<div class="questons flex flex-col divide-y divide-grey-300">
						<div class="flex align-center py-3">
							<div
								class="relative"
								style="width:24px;height:24px;border:1px solid gray;border-radius: 50%;"
							>
								<div
									class="absolute"
									style="background-color:#0075AF;border-radius:50%;height:70%;width:70%;left:50%; top:50%; transform: translate(-50%, -50%);"
								/>
							</div>
							<span class="pl-2">the answer</span>
						</div>
						<div class="flex align-center py-3">
							<div
								class="relative"
								style="width:24px;height:24px;border:1px solid gray;border-radius: 50%;"
							>
								<div
									class="absolute"
									style="background-color:#0075AF;border-radius:50%;height:70%;width:70%;left:50%; top:50%; transform: translate(-50%, -50%);"
								/>
							</div>
							<span class="pl-2">the answer</span>
						</div>
						<div class="flex align-center py-3">
							<div
								class="relative"
								style="width:24px;height:24px;border:1px solid gray;border-radius: 50%;"
							>
								<div
									class="absolute"
									style="background-color:#0075AF;border-radius:50%;height:70%;width:70%;left:50%; top:50%; transform: translate(-50%, -50%);"
								/>
							</div>
							<span class="pl-2">the answer</span>
						</div>
						<div class="flex align-center py-3">
							<div
								class="relative"
								style="width:24px;height:24px;border:1px solid gray;border-radius: 50%;"
							>
								<div
									class="absolute"
									style="background-color:#0075AF;border-radius:50%;height:70%;width:70%;left:50%; top:50%; transform: translate(-50%, -50%);"
								/>
							</div>
							<span class="pl-2">the answer</span>
						</div>
					</div>
				</div>
				<!-- feedback -->
				<div class="feedback pl-4 py-3 border-t border-grey-300" style="background-color: #F2F6F9;">
					<h6>Something wrong with this question? <span class="font-bold">Give feedback</span></h6>
				</div>
				<!-- loading progress -->
				<div class="w-full h-4">
					<div class="relative">
						<div class="overflow-hidden h-4 text-xs flex bg-gray-200">
							<div
								style="width:30%;background-color:#0075AF;"
								class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"
							/>
						</div>
					</div>
				</div>
				<!-- next question -->
				<div class="next bg-white px-4 py-3">
					<div class="holder flex justify-between items-center">
						<div class="time">
							<span>Q13</span>
							<span class="pl-4 font-bold">01:10</span>
						</div>
						<div class="button">
							<button
								class="px-4 py-2 rounded text-white font-bold"
								type="button"
								style="background-color: #0075AF;"
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
