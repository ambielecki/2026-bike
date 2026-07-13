<template>
  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-meta">
        <p class="footer-copyright">© 2026 ShowMyRides. All rights reserved.</p>
        <a
          class="footer-link"
          href="https://github.com/ambielecki/2026-bike"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: #f8f6f0;
  border-top: 0.0625rem solid rgba(53, 94, 59, 0.14);
  color: rgba(20, 32, 19, 0.76);
  padding: 1.5rem clamp(1rem, 4vw, 3rem);
}

.footer-content {
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  max-width: 72rem;
  text-align: center;
}

.footer-copyright {
  line-height: 1.5;
  margin: 0;
}

.footer-meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.footer-link {
  border-radius: 0.375rem;
  color: #355e3b;
  font-weight: 700;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
}

.footer-link:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.34);
  outline-offset: 0.125rem;
}

.footer-link:hover {
  background: rgba(53, 94, 59, 0.08);
}

@media (max-width: 48rem) {
  .footer-meta {
    flex-direction: column;
  }
}
</style>
