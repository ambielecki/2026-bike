<template>
  <main class="location-settings-page">
    <section class="page-header">
      <RouterLink class="back-link" :to="{ name: 'settings' }">Back to settings</RouterLink>
      <h1>Locations</h1>
    </section>

    <section class="settings-panel" aria-labelledby="locations-title">
      <h2 id="locations-title">Location Management</h2>
      <p>Location editing will be available here.</p>
    </section>
  </main>
</template>

<style scoped>
.location-settings-page {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.settings-panel {
  margin-left: auto;
  margin-right: auto;
  max-width: 52rem;
}

.page-header {
  display: grid;
  gap: 0.75rem;
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
}

.back-link {
  color: #355e3b;
  font-weight: 800;
  justify-self: start;
  text-decoration: none;
}

.settings-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: grid;
  gap: 0.75rem;
  padding: clamp(1.25rem, 4vw, 2rem);
}

.back-link:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}
</style>
