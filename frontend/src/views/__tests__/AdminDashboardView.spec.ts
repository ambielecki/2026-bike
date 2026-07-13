import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import { getAdminStats } from '@/services/admin'
import { ApiError } from '@/services/api'
import AdminDashboardView from '@/views/AdminDashboardView.vue'

vi.mock('@/services/admin', () => ({
  getAdminStats: vi.fn(),
}))

const mockedGetAdminStats = vi.mocked(getAdminStats)

function mountAdminDashboardView() {
  return mount(AdminDashboardView, {
    global: {
      stubs: {
        RouterLink: {
          props: ['to'],
          template: '<a href="#"><slot /></a>',
        },
      },
    },
  })
}

describe('AdminDashboardView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedGetAdminStats.mockResolvedValue({
      total_users: 1234,
      new_users_last_7_days: 12,
      total_routes_logged: 9876,
      routes_logged_last_7_days: 34,
    })
  })

  it('loads and renders admin stats', async () => {
    const wrapper = mountAdminDashboardView()
    await flushPromises()

    expect(mockedGetAdminStats).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Total Users')
    expect(wrapper.text()).toContain('1,234')
    expect(wrapper.text()).toContain('New Users This Week')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('Total Routes Logged')
    expect(wrapper.text()).toContain('9,876')
    expect(wrapper.text()).toContain('Routes Logged This Week')
    expect(wrapper.text()).toContain('34')
  })

  it('shows an error when stats cannot be loaded', async () => {
    mockedGetAdminStats.mockRejectedValue(new ApiError(500, 'Unable to load stats.'))

    const wrapper = mountAdminDashboardView()
    await flushPromises()

    expect(wrapper.text()).toContain('Unable to load stats.')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })
})
