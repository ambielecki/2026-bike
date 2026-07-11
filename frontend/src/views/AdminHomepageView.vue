<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AuthTextField from '@/components/auth/AuthTextField.vue'
import AppFileField from '@/components/form/AppFileField.vue'
import AppTextarea from '@/components/form/AppTextarea.vue'
import { ApiError } from '@/services/api'
import {
  getAdminHomepage,
  updateHomepage,
  uploadHomepageImage,
  type HomepageImage,
} from '@/services/homepage'
import { useToastStore } from '@/stores/toasts'

interface EditableHighlight {
  title: string
  copy: string
}

const toastStore = useToastStore()

const siteName = ref('')
const headline = ref('')
const intro = ref('')
const highlights = ref<EditableHighlight[]>([])
const carouselImages = ref<HomepageImage[]>([])
const availableImages = ref<HomepageImage[]>([])
const formError = ref('')
const isLoading = ref(false)
const isSaving = ref(false)

const isUploadModalOpen = ref(false)
const uploadFile = ref<File | null>(null)
const uploadDescription = ref('')
const uploadAltText = ref('')
const uploadFileError = ref('')
const uploadAltTextError = ref('')
const uploadFormError = ref('')
const isUploading = ref(false)

const selectedImageIds = computed(() => new Set(carouselImages.value.map((image) => image.id)))
const unselectedImages = computed(() =>
  availableImages.value.filter((image) => !selectedImageIds.value.has(image.id)),
)

onMounted(() => {
  void loadHomepage()
})

async function loadHomepage() {
  isLoading.value = true
  formError.value = ''

  try {
    const content = await getAdminHomepage()

    siteName.value = content.site_name
    headline.value = content.headline
    intro.value = content.intro
    highlights.value = content.highlights.map((highlight) => ({
      title: highlight.title,
      copy: highlight.copy,
    }))
    carouselImages.value = [...content.carousel_images]
    availableImages.value = [...content.available_images]
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to load homepage.'
  } finally {
    isLoading.value = false
  }
}

async function saveHomepage() {
  formError.value = ''

  if (!isValidHomepage()) {
    return
  }

  isSaving.value = true

  try {
    const updated = await updateHomepage({
      site_name: siteName.value.trim(),
      headline: headline.value.trim(),
      intro: intro.value.trim(),
      highlights: highlights.value.map((highlight) => ({
        title: highlight.title.trim(),
        copy: highlight.copy.trim(),
      })),
      carousel_image_ids: carouselImages.value.map((image) => image.id),
    })

    siteName.value = updated.site_name
    headline.value = updated.headline
    intro.value = updated.intro
    highlights.value = updated.highlights.map((highlight) => ({
      title: highlight.title,
      copy: highlight.copy,
    }))
    carouselImages.value = [...updated.carousel_images]
    toastStore.success('Homepage updated')
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Unable to save homepage.'
  } finally {
    isSaving.value = false
  }
}

function isValidHomepage() {
  if (!siteName.value.trim() || !headline.value.trim() || !intro.value.trim()) {
    formError.value = 'Site name, headline, and intro are required.'
    return false
  }

  if (highlights.value.length === 0) {
    formError.value = 'Add at least one highlight.'
    return false
  }

  if (highlights.value.some((highlight) => !highlight.title.trim() || !highlight.copy.trim())) {
    formError.value = 'Each highlight needs a title and copy.'
    return false
  }

  return true
}

function addHighlight() {
  highlights.value.push({
    title: '',
    copy: '',
  })
}

function removeHighlight(index: number) {
  if (highlights.value.length === 1) {
    formError.value = 'Add another highlight before removing this one.'
    return
  }

  highlights.value.splice(index, 1)
}

function moveHighlight(index: number, direction: -1 | 1) {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= highlights.value.length) {
    return
  }

  const [highlight] = highlights.value.splice(index, 1)

  if (!highlight) {
    return
  }

  highlights.value.splice(targetIndex, 0, highlight)
}

function addCarouselImage(image: HomepageImage) {
  carouselImages.value.push(image)
}

function removeCarouselImage(index: number) {
  carouselImages.value.splice(index, 1)
}

function moveCarouselImage(index: number, direction: -1 | 1) {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= carouselImages.value.length) {
    return
  }

  const [image] = carouselImages.value.splice(index, 1)

  if (!image) {
    return
  }

  carouselImages.value.splice(targetIndex, 0, image)
}

function openUploadModal() {
  uploadFile.value = null
  uploadDescription.value = ''
  uploadAltText.value = ''
  uploadFileError.value = ''
  uploadAltTextError.value = ''
  uploadFormError.value = ''
  isUploadModalOpen.value = true
}

function closeUploadModal() {
  if (isUploading.value) {
    return
  }

  isUploadModalOpen.value = false
}

async function submitImageUpload() {
  uploadFormError.value = ''

  if (!validateImageUpload() || !uploadFile.value) {
    return
  }

  isUploading.value = true

  try {
    const image = await uploadHomepageImage({
      image: uploadFile.value,
      description: uploadDescription.value,
      altText: uploadAltText.value.trim(),
    })

    availableImages.value = [image, ...availableImages.value]
    carouselImages.value.push(image)
    isUploadModalOpen.value = false
    toastStore.success('Image uploaded')
  } catch (error) {
    uploadFormError.value = error instanceof ApiError ? error.message : 'Unable to upload image.'
  } finally {
    isUploading.value = false
  }
}

function validateImageUpload() {
  let isValid = true

  if (!uploadFile.value) {
    uploadFileError.value = 'Image is required.'
    isValid = false
  } else {
    uploadFileError.value = ''
  }

  if (!uploadAltText.value.trim()) {
    uploadAltTextError.value = 'Alt text is required.'
    isValid = false
  } else {
    uploadAltTextError.value = ''
  }

  return isValid
}
</script>

<template>
  <main class="admin-homepage">
    <section class="page-header">
      <RouterLink class="back-link" :to="{ name: 'admin-tools' }">Back to admin</RouterLink>
      <h1>Homepage</h1>
    </section>

    <p v-if="isLoading" class="status-text">Loading homepage...</p>

    <form v-else class="editor-layout" novalidate @submit.prevent="saveHomepage">
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

      <section class="editor-panel" aria-labelledby="hero-content-title">
        <h2 id="hero-content-title">Hero Content</h2>
        <AuthTextField id="homepage-site-name" v-model="siteName" label="Site name" />
        <AuthTextField id="homepage-headline" v-model="headline" label="Headline" />
        <AppTextarea id="homepage-intro" v-model="intro" label="Intro" :rows="5" />
      </section>

      <section class="editor-panel" aria-labelledby="highlights-title">
        <div class="panel-heading">
          <h2 id="highlights-title">Highlights</h2>
          <button class="secondary-action" type="button" @click="addHighlight">Add Highlight</button>
        </div>

        <ol class="editable-list">
          <li v-for="(highlight, index) in highlights" :key="index" class="editable-item">
            <AuthTextField
              :id="`highlight-title-${index}`"
              v-model="highlight.title"
              label="Title"
            />
            <AppTextarea
              :id="`highlight-copy-${index}`"
              v-model="highlight.copy"
              label="Copy"
              :rows="3"
            />
            <div class="item-actions">
              <button
                class="secondary-action"
                :disabled="index === 0"
                type="button"
                @click="moveHighlight(index, -1)"
              >
                Up
              </button>
              <button
                class="secondary-action"
                :disabled="index === highlights.length - 1"
                type="button"
                @click="moveHighlight(index, 1)"
              >
                Down
              </button>
              <button class="danger-action" type="button" @click="removeHighlight(index)">
                Remove
              </button>
            </div>
          </li>
        </ol>
      </section>

      <section class="editor-panel" aria-labelledby="carousel-title">
        <div class="panel-heading">
          <h2 id="carousel-title">Carousel Images</h2>
          <button class="secondary-action" type="button" @click="openUploadModal">Upload Image</button>
        </div>

        <p v-if="carouselImages.length === 0" class="status-text">No carousel images selected.</p>

        <ol v-else class="image-list">
          <li v-for="(image, index) in carouselImages" :key="image.id" class="image-item">
            <img :src="image.urls.small" :alt="image.alt_text" />
            <div>
              <h3>{{ image.alt_text }}</h3>
              <p>{{ image.description || 'No description' }}</p>
            </div>
            <div class="image-actions">
              <button
                class="secondary-action"
                :disabled="index === 0"
                type="button"
                @click="moveCarouselImage(index, -1)"
              >
                Up
              </button>
              <button
                class="secondary-action"
                :disabled="index === carouselImages.length - 1"
                type="button"
                @click="moveCarouselImage(index, 1)"
              >
                Down
              </button>
              <button class="danger-action" type="button" @click="removeCarouselImage(index)">
                Remove
              </button>
            </div>
          </li>
        </ol>

        <div v-if="unselectedImages.length" class="available-images">
          <h3>Available Images</h3>
          <ul class="image-grid">
            <li v-for="image in unselectedImages" :key="image.id">
              <img :src="image.urls.small" :alt="image.alt_text" />
              <button class="secondary-action" type="button" @click="addCarouselImage(image)">
                Add
              </button>
            </li>
          </ul>
        </div>
      </section>

      <div class="save-bar">
        <button class="primary-action" :disabled="isSaving" type="submit">
          {{ isSaving ? 'Saving...' : 'Save Homepage' }}
        </button>
      </div>
    </form>

    <div v-if="isUploadModalOpen" class="modal-layer" role="presentation">
      <button
        class="modal-backdrop"
        type="button"
        aria-label="Close image upload form"
        @click="closeUploadModal"
      ></button>

      <section class="modal-panel" aria-labelledby="upload-image-title" aria-modal="true" role="dialog">
        <div class="modal-header">
          <h2 id="upload-image-title">Upload Image</h2>
          <button
            class="close-button"
            type="button"
            aria-label="Close image upload form"
            @click="closeUploadModal"
          >
            ×
          </button>
        </div>

        <p v-if="uploadFormError" class="form-error" role="alert">{{ uploadFormError }}</p>

        <form class="upload-form" novalidate @submit.prevent="submitImageUpload">
          <AppFileField
            id="homepage-image-file"
            accept="image/*"
            :error="uploadFileError"
            label="Image"
            @change="uploadFile = $event"
          />
          <AuthTextField
            id="homepage-image-alt"
            v-model="uploadAltText"
            :error="uploadAltTextError"
            label="Alt text"
          />
          <AppTextarea
            id="homepage-image-description"
            v-model="uploadDescription"
            label="Description"
            :rows="3"
          />

          <div class="modal-actions">
            <button class="secondary-action" type="button" @click="closeUploadModal">Cancel</button>
            <button class="primary-action" :disabled="isUploading" type="submit">
              {{ isUploading ? 'Uploading...' : 'Upload Image' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.admin-homepage {
  background: #f8f6f0;
  min-height: calc(100vh - 4rem);
  padding: 2rem clamp(1rem, 4vw, 3rem) 3rem;
}

.page-header,
.editor-layout {
  margin-left: auto;
  margin-right: auto;
  max-width: 58rem;
}

.page-header {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.editor-layout,
.editor-panel,
.editable-item,
.upload-form {
  display: grid;
  gap: 1rem;
}

.editor-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  padding: clamp(1.25rem, 4vw, 2rem);
}

.panel-heading,
.item-actions,
.image-actions,
.save-bar,
.modal-header,
.modal-actions {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

h1,
h2,
h3,
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

h3 {
  color: #142013;
  font-size: 1rem;
  line-height: 1.3;
}

p,
.status-text {
  color: #52614f;
  line-height: 1.5;
}

.back-link {
  color: #355e3b;
  font-weight: 800;
  justify-self: start;
  text-decoration: none;
}

.editable-list,
.image-list,
.image-grid {
  display: grid;
  gap: 0.875rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.editable-item,
.image-item {
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  padding: 1rem;
}

.image-item {
  align-items: center;
  display: grid;
  gap: 1rem;
  grid-template-columns: 6rem 1fr auto;
}

.image-item img,
.image-grid img {
  aspect-ratio: 4 / 3;
  border-radius: 0.375rem;
  display: block;
  object-fit: cover;
  width: 100%;
}

.available-images {
  display: grid;
  gap: 0.75rem;
}

.image-grid {
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
}

.image-grid li {
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
}

.primary-action,
.secondary-action,
.danger-action {
  align-items: center;
  border-radius: 0.375rem;
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-weight: 700;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 1rem;
  text-decoration: none;
}

.primary-action {
  background: #355e3b;
  border: 0;
  color: #ffffff;
}

.secondary-action {
  background: #ffffff;
  border: 0.0625rem solid rgba(53, 94, 59, 0.32);
  color: #29492e;
}

.danger-action {
  background: #ffffff;
  border: 0.0625rem solid rgba(176, 44, 44, 0.34);
  color: #7c2020;
}

.primary-action:disabled,
.secondary-action:disabled,
.danger-action:disabled {
  cursor: wait;
  opacity: 0.6;
}

.form-error {
  background: rgba(176, 44, 44, 0.08);
  border: 0.0625rem solid rgba(176, 44, 44, 0.22);
  border-radius: 0.375rem;
  color: #7c2020;
  line-height: 1.5;
  padding: 0.75rem;
}

.modal-layer {
  align-items: center;
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 50;
}

.modal-backdrop {
  background: rgba(20, 32, 19, 0.42);
  border: 0;
  inset: 0;
  position: fixed;
}

.modal-panel {
  background: #fffdf7;
  border: 0.0625rem solid rgba(53, 94, 59, 0.14);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgba(20, 32, 19, 0.08);
  display: grid;
  gap: 1.125rem;
  max-width: 34rem;
  padding: 1.25rem;
  position: relative;
  width: min(100%, 34rem);
}

.close-button {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 0.375rem;
  color: #142013;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.75rem;
  height: 2.5rem;
  justify-content: center;
  line-height: 1;
  padding: 0;
  width: 2.5rem;
}

.modal-actions,
.save-bar {
  justify-content: flex-end;
}

.back-link:focus-visible,
.primary-action:focus-visible,
.secondary-action:focus-visible,
.danger-action:focus-visible,
.close-button:focus-visible {
  outline: 0.1875rem solid rgba(53, 94, 59, 0.28);
  outline-offset: 0.125rem;
}

@media (max-width: 48rem) {
  .panel-heading,
  .item-actions,
  .image-actions,
  .modal-actions,
  .save-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .image-item {
    grid-template-columns: 1fr;
  }
}
</style>
