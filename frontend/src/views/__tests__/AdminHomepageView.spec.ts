import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import {
  deleteHomepageImage,
  getAdminHomepage,
  updateHomepageImage,
  updateHomepage,
  uploadHomepageImage,
} from '@/services/homepage'
import AdminHomepageView from '@/views/AdminHomepageView.vue'

vi.mock('@/services/homepage', () => ({
  deleteHomepageImage: vi.fn(),
  getAdminHomepage: vi.fn(),
  updateHomepage: vi.fn(),
  updateHomepageImage: vi.fn(),
  uploadHomepageImage: vi.fn(),
}))

const mockedDeleteHomepageImage = vi.mocked(deleteHomepageImage)
const mockedGetAdminHomepage = vi.mocked(getAdminHomepage)
const mockedUpdateHomepage = vi.mocked(updateHomepage)
const mockedUpdateHomepageImage = vi.mocked(updateHomepageImage)
const mockedUploadHomepageImage = vi.mocked(uploadHomepageImage)

const carouselImage = {
  id: 10,
  description: 'Trail overlook',
  alt_text: 'Mountain trail overlook',
  urls: {
    small: '/storage/homepage/images/small/trail.jpg',
    medium: '/storage/homepage/images/medium/trail.jpg',
    large: '/storage/homepage/images/large/trail.jpg',
    original: '/storage/homepage/images/original/trail.jpg',
  },
}

const availableImage = {
  id: 11,
  description: null,
  alt_text: 'Forest trail',
  urls: {
    small: '/storage/homepage/images/small/forest.jpg',
    medium: '/storage/homepage/images/medium/forest.jpg',
    large: '/storage/homepage/images/large/forest.jpg',
    original: '/storage/homepage/images/original/forest.jpg',
  },
}

function homepageContent() {
  return {
    id: 1,
    site_name: 'ShowMyRides',
    headline: 'Ride the best loops.',
    intro: 'Homepage intro.',
    highlights: [
      {
        title: 'Plan',
        copy: 'Pick the right route.',
        sort_order: 0,
      },
    ],
    carousel_images: [carouselImage],
    available_images: [carouselImage, availableImage],
  }
}

async function mountAdminHomepageView() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const wrapper = mount(AdminHomepageView, {
    global: {
      plugins: [pinia],
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a href="#"><slot /></a>',
        },
      },
    },
  })

  await flushPromises()

  return wrapper
}

function buttonByText(wrapper: ReturnType<typeof mount>, text: string) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === text)

  if (!button) {
    throw new Error(`Unable to find button: ${text}`)
  }

  return button
}

describe('AdminHomepageView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetAdminHomepage.mockResolvedValue(homepageContent())
    mockedUpdateHomepage.mockResolvedValue(homepageContent())
    mockedUpdateHomepageImage.mockResolvedValue({
      ...carouselImage,
      description: 'Updated trail description',
      alt_text: 'Updated trail alt text',
    })
    mockedDeleteHomepageImage.mockResolvedValue()
    mockedUploadHomepageImage.mockResolvedValue(availableImage)
  })

  it('updates image metadata in the carousel and available image state', async () => {
    const wrapper = await mountAdminHomepageView()

    await buttonByText(wrapper, 'Edit').trigger('click')
    await wrapper.find('#edit-homepage-image-alt').setValue('Updated trail alt text')
    await wrapper.find('#edit-homepage-image-description').setValue('Updated trail description')
    await wrapper.find('form.upload-form').trigger('submit')
    await flushPromises()

    expect(mockedUpdateHomepageImage).toHaveBeenCalledWith(10, {
      description: 'Updated trail description',
      altText: 'Updated trail alt text',
    })
    expect(wrapper.text()).toContain('Updated trail alt text')
    expect(wrapper.text()).toContain('Updated trail description')
  })

  it('removes an image from the system and local carousel state after confirmation', async () => {
    const wrapper = await mountAdminHomepageView()

    await buttonByText(wrapper, 'Delete').trigger('click')
    await buttonByText(wrapper, 'Delete Image').trigger('click')
    await flushPromises()

    expect(mockedDeleteHomepageImage).toHaveBeenCalledWith(10)
    expect(wrapper.text()).not.toContain('Mountain trail overlook')
    expect(wrapper.text()).toContain('No carousel images selected.')
  })

  it('removes an image from the carousel without deleting it from the system', async () => {
    const wrapper = await mountAdminHomepageView()

    await buttonByText(wrapper, 'Remove from carousel').trigger('click')
    await flushPromises()

    expect(mockedDeleteHomepageImage).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('No carousel images selected.')
    expect(wrapper.text()).toContain('Mountain trail overlook')
  })
})
