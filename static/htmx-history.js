// htmx restores history from a snapshot of the page's HTML. A form control's live state isn't in
// the HTML: what was typed into an input is only its value property, not its value attribute,
// and a picked <option> isn't marked `selected`. So on Back the controls came back as the page
// was first rendered (e.g. an empty search box, or the Ruleset picker on SRD 5.1) above results
// that were still filtered. Copy the live state into the HTML just before the snapshot is taken.
document.body.addEventListener("htmx:beforeHistorySave", function () {
	for (const input of document.querySelectorAll("input[type=text], input[type=search]")) {
		input.setAttribute("value", input.value)
	}
	for (const option of document.querySelectorAll("select option")) {
		option.toggleAttribute("selected", option.selected)
	}
})
