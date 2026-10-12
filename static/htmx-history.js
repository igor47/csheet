// htmx restores history from a snapshot of the page's HTML. What a user typed into an input
// is only its live value, not its value attribute, so it would come back empty (e.g. a search
// box showing nothing above results that are still filtered). Copy the values into the HTML
// just before the snapshot is taken.
document.body.addEventListener("htmx:beforeHistorySave", function () {
	for (const input of document.querySelectorAll("input[type=text], input[type=search]")) {
		input.setAttribute("value", input.value)
	}
})
