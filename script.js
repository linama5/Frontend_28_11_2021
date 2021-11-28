const API = "https://lernia-sjj-assignments.vercel.app/api/challenges";

document.addEventListener("DOMContentLoaded", function (event) {
	let showFilterChallenges = document.querySelector("#show-filter-challenges"),
		hideFilterChallenges = document.querySelector("#hide-filter-challenges"),
		distinctTags = new Set();
	showFilterChallenges.addEventListener("click", function (event) {
		document.querySelector("#filter-challenges").classList.remove("hidden");
	}, false);
	hideFilterChallenges.addEventListener("click", function (event) {
		document.querySelector("#filter-challenges").classList.add("hidden");
	}, false);
	Array.from(document.querySelectorAll(".rating > input[type='range']")).forEach(function (input) {
		input.addEventListener("change", function (event) {
			input.previousElementSibling.style.setProperty("width", `${+input.value * 18}px`);
		}, false);
		input.dispatchEvent(new Event("change"));
	});

	fetch(API, {
		"method": "GET",
		"mode": "cors",
	}).then(function (response) {
		if (response.ok) {
			response.json().then(function (data) {
				let cardList = document.querySelector("#challenges > .card-list");
				data.challenges.forEach(function (challenge) {
					challenge.labels.forEach(function (label) {
						distinctTags.add(label);
					});
					cardList.innerHTML += `
						<li class="card" data-rating="${challenge.rating}" data-type="${challenge.type}" data-tags="${challenge.labels.join(' ')}">
							<div class="image" style="background-image: url('${challenge.image}')"></div>
							<div class="content">
								<div class="title" title="${challenge.title} (${challenge.type.replace("on", "on-")})">${challenge.title} (${challenge.type.replace("on", "on-")})</div>
								<div class="rating">
									<span><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i><i class="far fa-star"></i></span>
									<span style="width: ${challenge.rating * 18}px"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></span>
									${
										challenge.minParticipants == challenge.maxParticipants
											? challenge.minParticipants
											: challenge.minParticipants + "-" + challenge.maxParticipants
									} participants
								</div>
								<div class="description">${challenge.description}</div>
							</div>
							<button data-title="${challenge.title}" data-min="${challenge.minParticipants}" data-max="${challenge.maxParticipants}" class="primary on-white">Book this room</button>
						</li>
					`;
				});

				//Array of all the buttons from the cards 
				Array.from(document.querySelectorAll("#challenges button")).forEach(function (button) {

					button.addEventListener("click", function (event) {

						let maxDate,
							minDate,
							dateObject = new Date(),
							modal = document.createElement("dialog")
							maxParticipants = +event.target.dataset.max,
							minParticipants = +event.target.dataset.min;

						minDate = dateObject.toLocaleDateString().split('/').reverse().join('-');
						//23/11/2021
						//23 11 2021
						//2021 11 23 
						//2021-11-23

						dateObject.setFullYear(dateObject.getFullYear() + 1);

						maxDate = dateObject.toLocaleDateString().split('/').reverse().join('-');
						
						modal.innerHTML = `
							<a class="fas fa-times"></a>
							<section>
								<h1>Book room "${event.target.dataset.title}" (step 1)</h1>
								<p>What day would you like to come?</p>
								<label for="booking-date">Date</label>
								<input id="booking-date" max="${maxDate}" min="${minDate}" required type="date">
								<button class="primary on-white">Search available times</button>
							</section>
							<section class="hidden">
								<h1>Book room "${event.target.dataset.title}" (step 2)</h1>
								<label for="booking-name">Name</label>
								<input id="booking-name" required type="text">
								<label for="booking-email">E-mail</label>
								<input id="booking-email" required type="email">
								<label for="booking-time">What time?</label>
								<select id="booking-time"></select>
								<label for="booking-participants">How many participants?</label>
								<select id="booking-participants"></select>
								<button class="primary on-white">Submit booking</button>
							</section>
							<section class="hidden">
								<h1>Thank you!</h1>
								<a class="primary">Back to challenges</a>
							</select>
						`;
						let date = modal.querySelector("#booking-date"),
							name = modal.querySelector("#booking-name"),
							email = modal.querySelector("#booking-email"),
							time = modal.querySelector("#booking-time"),
							participants = modal.querySelector("#booking-participants"),
							currentStep = modal.querySelector("section:not(.hidden)"),
							buttons = modal.querySelectorAll("button");
						for (let number = minParticipants; number <= maxParticipants; ++number) {
							let option = document.createElement("option");
							option.text = `${number} participans`;
							option.value = number;
							participants.options.add(option);
						}
						//first button 
						buttons[0].addEventListener("click", function (event) {
							date.setCustomValidity("");
							if (date.checkValidity()) {
								date.disabled = true;
								fetch(`https://lernia-sjj-assignments.vercel.app/api/booking/available-times?date=${date.value}`, {
									"method": "GET",
									"mode": "cors"
								}).then(function (response) {
									if (response.ok) {
										response.json().then(function (data) {
											if (data.slots.length > 0) {
												data.slots.forEach(function (slot) {
													let option = document.createElement("option");
													option.text = slot;
													time.options.add(option);
												});
												currentStep.classList.add("hidden");
												currentStep = currentStep.nextElementSibling;
												currentStep.classList.remove("hidden");
											} else {
												date.disabled = false;
												date.setCustomValidity("No times available");
												date.reportValidity();
											}
										}).catch(function (error) {
											date.disabled = false;
											date.setCustomValidity(error.toString());
											date.reportValidity();
										});
									} else {
										date.disabled = false;
										date.setCustomValidity("Unexpected server response");
										date.reportValidity();
									}
								}).catch(function (error) {
									date.disabled = false;
									date.setCustomValidity(error.toString());
									date.reportValidity();
								});
							} else {
								date.setCustomValidity("Invalid input date");
								date.reportValidity();
							}
						}, false);
						//Second button 
						buttons[1].addEventListener("click", function (event) {
							if (name.checkValidity() && email.checkValidity()) {
								name.disabled = true;
								email.disabled = true;
								time.disabled = true;
								participants.disabled = true;
								fetch("https://lernia-sjj-assignments.vercel.app/api/booking/reservations", {
									"body": JSON.stringify({
										date: date.value,
										name: name.value,
										email: email.value,
										time: time.value,
										participants: +participants.value
									}),
									"headers": { "Content-Type": "application/json" },
									"method": "POST",
									"mode": "cors"
								}).then(function (response) {
									if (response.ok) {
										response.json().then(function (data) {
											currentStep.classList.add("hidden");
											currentStep = currentStep.nextElementSibling;
											currentStep.classList.remove("hidden");
										}).catch(function (error) {
											// TODO: Display error.
										});
									} else {
										// TODO: Unexpected server response.
									}
								}).catch(function (error) {
									// TODO: Display error.
								});
							} else {
								// TODO: Invalid name or email.
							}
						}, false);
						Array.from(modal.querySelectorAll('a')).forEach(function (link) {
							link.addEventListener("click", function (event) {
								modal.remove();
							}, false);
						});
						document.body.append(modal);
						modal.showModal();
					}, false);
				});
				function filter (event) {
					let byTypes = Array.from(document.forms["filter-challenges"].elements["types[]"]).filter(function (input) { return input.checked }).map(function (input) { return `[data-type="${input.value}"]`; }).join(),
						byTags = Array.from(document.forms["filter-challenges"].elements["tags[]"]).filter(function (input) { return input.checked }).map(function (input) { return `[data-tags~="${input.value}"]`; }).join(),
						maxRanting = +document.forms["filter-challenges"].elements["maximum"].value,
						minRanting = +document.forms["filter-challenges"].elements["minimum"].value,
						keywords = document.forms["filter-challenges"].elements["keywords"].value.trim(),
						pattern = new RegExp(keywords.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"),
						count = 0;
					Array.from(document.querySelectorAll("#challenges .card")).forEach(function (card) {
						let rating = +card.dataset.rating,
							title = card.querySelector(".title").textContent,
							description = card.querySelector(".description").textContent;
						if (
							byTypes.length > 0 &&
							byTags.length > 0 &&
							card.matches(byTypes) &&
							card.matches(byTags) &&
							rating >= minRanting && rating <= maxRanting &&
							(
								keywords.length == 0 ||
								pattern.test(title) ||
								pattern.test(description)
							)
						) {
							card.classList.remove("hidden");
							++count;
						} else {
							card.classList.add("hidden");
						}
					});
					if (count > 0) {
						document.querySelector("#challenges > h2").classList.add("hidden");
					} else {
						document.querySelector("#challenges > h2").classList.remove("hidden");
					}
				}
				let filterByTags = document.querySelector("#filter-by-tags");
				distinctTags.forEach(function (tag) {
					let input = document.createElement("input");
					input.setAttribute("id", `tag-${tag}`);
					input.setAttribute("checked", "checked");
					input.setAttribute("class", "hidden");
					input.setAttribute("name", "tags[]");
					input.setAttribute("type", "checkbox");
					input.setAttribute("value", tag);
					filterByTags.append(input);
					filterByTags.innerHTML += `<label class="chip" for="tag-${tag}">${tag}</label>`;
				});
				document.forms["filter-challenges"].elements["keywords"].addEventListener("keyup", filter, false);
				Array.from(document.forms["filter-challenges"].elements).forEach(function (input) {
					input.addEventListener("change", filter, false);
				});
			}).catch(function (error) {
				console.error(error);
			});
		}
	}).catch(function (error) {
		console.error(error);
	});
}, false);