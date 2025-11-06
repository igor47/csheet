// Auto-close flash messages with pause on hover
(function () {
  function initFlashMessages() {
    const alerts = document.querySelectorAll('[data-auto-close="true"]')

    alerts.forEach((alert) => {
      const progressBar = alert.querySelector('.progress-bar')
      if (!progressBar) return

      let timeoutId = setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alert)
        bsAlert.close()
      }, 5000)

      // Pause animation on hover
      alert.addEventListener('mouseenter', () => {
        progressBar.style.animationPlayState = 'paused'
        clearTimeout(timeoutId)
      })

      // Resume animation on mouse leave
      alert.addEventListener('mouseleave', () => {
        progressBar.style.animationPlayState = 'running'
        // Calculate remaining time based on progress bar width
        const currentWidth = progressBar.offsetWidth
        const totalWidth = progressBar.parentElement.offsetWidth
        const remainingTime = (currentWidth / totalWidth) * 5000

        timeoutId = setTimeout(() => {
          const bsAlert = bootstrap.Alert.getOrCreateInstance(alert)
          bsAlert.close()
        }, remainingTime)
      })
    })
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', initFlashMessages)

  // Reinitialize after HTMX swaps
  document.body.addEventListener('htmx:afterSwap', initFlashMessages)
})()
