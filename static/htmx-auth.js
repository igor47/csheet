// Handle HTMX error responses with redirects
// Allows 401/403/404 responses to trigger redirects when HX-Redirect header is present
document.body.addEventListener("htmx:beforeSwap", function (evt) {
	// Check if response has HX-Redirect header
	const hxRedirect = evt.detail.xhr.getResponseHeader("HX-Redirect")
	if (hxRedirect) {
		// Allow error status codes (401, 403, 404) to swap when redirect is present
		if (
			evt.detail.xhr.status === 401 ||
			evt.detail.xhr.status === 403 ||
			evt.detail.xhr.status === 404
		) {
			evt.detail.shouldSwap = true
			evt.detail.isError = false
		}
	}
})
