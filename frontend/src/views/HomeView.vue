<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import {
  defaultHomepageContent,
  getHomepage,
  homepageHeroImageUrl,
  type HomepageContent,
} from '@/services/homepage'

const siteName = 'ShowMyRides'
const headline = 'Track every route and see where you have been'
const intro =
  'Keep a clean record of the trails you ride, remember the lines you liked, and build a personal map of every loop, climb, and descent. Even track rides from Zwift in Watopia or Makuri Islands.'

const content = ref<HomepageContent>(defaultHomepageContent)
const activeImageIndex = ref(0)

const activeImage = computed(() => content.value.carousel_images[activeImageIndex.value] ?? null)
const activeImageUrl = computed(() => {
  if (!activeImage.value) {
    return undefined
  }

  return activeImageIndex.value === 0 ? homepageHeroImageUrl() : activeImage.value.urls.large
})

onMounted(() => {
  void loadHomepage()
})

async function loadHomepage() {
  try {
    content.value = await getHomepage()
    activeImageIndex.value = 0
  } catch {
    content.value = defaultHomepageContent
  }
}

function previousImage() {
  const imageCount = content.value.carousel_images.length

  if (imageCount === 0) {
    return
  }

  activeImageIndex.value = (activeImageIndex.value - 1 + imageCount) % imageCount
}

function nextImage() {
  const imageCount = content.value.carousel_images.length

  if (imageCount === 0) {
    return
  }

  activeImageIndex.value = (activeImageIndex.value + 1) % imageCount
}
</script>

<template>
  <section class="hero">
    <v-container class="fill-height">
      <v-row align="center" class="hero-row" justify="space-between">
        <v-col cols="12" md="6">
          <div class="eyebrow">{{ siteName }}</div>
          <h1 class="headline">{{ headline }}</h1>
          <p class="intro">{{ intro }}</p>
        </v-col>

        <v-col cols="12" md="5">
          <section class="carousel-panel" aria-label="Homepage images">
            <template v-if="activeImage">
              <img
                class="carousel-image"
                :src="activeImageUrl"
                :alt="activeImage.alt_text"
                fetchpriority="high"
              />
              <div class="carousel-footer">
                <p v-if="activeImage.description">{{ activeImage.description }}</p>
                <div class="carousel-controls">
                  <button type="button" aria-label="Previous image" @click="previousImage">
                    Previous
                  </button>
                  <span>{{ activeImageIndex + 1 }} / {{ content.carousel_images.length }}</span>
                  <button type="button" aria-label="Next image" @click="nextImage">Next</button>
                </div>
              </div>
            </template>

            <div v-else class="carousel-empty">
              <span class="sr-only">No homepage images selected.</span>
            </div>
          </section>
        </v-col>
      </v-row>
    </v-container>
  </section>

  <section v-if="content.highlights.length" id="highlights" class="highlights">
    <v-container>
      <v-row>
        <v-col
          v-for="highlight in content.highlights"
          :key="`${highlight.sort_order}-${highlight.title}`"
          cols="12"
          md="4"
        >
          <v-card class="feature-card" height="100%" rounded="xl" variant="tonal">
            <div class="feature-title">{{ highlight.title }}</div>
            <p class="feature-copy">{{ highlight.copy }}</p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<style scoped>
.hero {
  background:
    radial-gradient(circle at top left, rgba(163, 214, 181, 0.26), transparent 34%),
    linear-gradient(160deg, #f5f1e8 0%, #dce7d4 48%, #f8f6f0 100%);
  min-height: calc(100vh - 4rem);
}

.hero-row {
  min-height: calc(100vh - 4rem);
  padding: 3rem 0;
}

.eyebrow {
  color: #355e3b;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.headline {
  color: #142013;
  font-size: clamp(2.8rem, 6vw, 5.2rem);
  line-height: 1;
  margin: 0 0 1.5rem;
  max-width: 11ch;
}

.intro {
  color: rgba(20, 32, 19, 0.82);
  font-size: 1.1rem;
  line-height: 1.7;
  margin: 0;
  max-width: 34rem;
}

.carousel-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.12);
  display: grid;
  min-height: 28rem;
  overflow: hidden;
}

.carousel-image {
  aspect-ratio: 4 / 3;
  display: block;
  height: auto;
  object-fit: cover;
  width: 100%;
}

.carousel-footer,
.carousel-empty {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.carousel-footer p {
  color: #52614f;
  line-height: 1.5;
  margin: 0;
}

.carousel-controls {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.carousel-controls button {
  background: #355e3b;
  border: 0;
  border-radius: 0.375rem;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 2.5rem;
  padding: 0 0.875rem;
}

.carousel-controls span {
  color: #142013;
  font-weight: 700;
}

.carousel-empty {
  background: #f2f0e8;
  min-height: 28rem;
}

.sr-only {
  border: 0;
  clip: rect(0 0 0 0);
  height: 0.0625rem;
  margin: -0.0625rem;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 0.0625rem;
}

.highlights {
  background: #f8f6f0;
  padding: 4rem 0;
}

.feature-card {
  background: rgba(255, 253, 247, 0.86);
  border: 0.0625rem solid rgba(53, 94, 59, 0.1);
  padding: 1.5rem;
}

.feature-title {
  color: #142013;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 0.75rem;
}

.feature-copy {
  color: rgba(20, 32, 19, 0.74);
  line-height: 1.6;
  margin: 0;
}

button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}
</style>
