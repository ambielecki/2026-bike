<template>
  <main class="admin-page">
    <section class="page-header">
      <h1>Admin Tools</h1>
    </section>

    <section class="admin-panel" aria-labelledby="homepage-admin-title">
      <div>
        <h2 id="homepage-admin-title">Homepage</h2>
        <p>Edit the public homepage text, highlights, and image carousel.</p>
      </div>

      <RouterLink class="primary-action" :to="{ name: 'admin-homepage' }">
        Edit Homepage
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.admin-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.admin-panel {
  margin-left: auto;
  margin-right: auto;
  max-width: 52rem;
}

.page-header {
  margin-bottom: 1.25rem;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #142013;
  font-size: 2rem;
  line-height: 1.2;
}

h2 {
  color: #142013;
  font-size: 1.25rem;
  line-height: 1.3;
}

p {
  color: #52614f;
  line-height: 1.5;
  margin-top: 0.5rem;
}

.admin-panel {
  align-items: center;
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: clamp(1.25rem, 4vw, 2rem);
}

.primary-action {
  align-items: center;
  background: #355e3b;
  border-radius: 0.375rem;
  color: #ffffff;
  display: inline-flex;
  font-weight: 700;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  text-decoration: none;
  white-space: nowrap;
}

.primary-action:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

@media (max-width: 40rem) {
  .admin-panel {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
