// Lightweight screen-reader announcer for aria-live polite regions
export function announce(message: string): void {
  const el = document.getElementById('aria-live-announcer');
  if (el) {
    el.textContent = '';
    // Small timeout ensures screen readers register the text change
    setTimeout(() => {
      el.textContent = message;
    }, 50);
  }
}
