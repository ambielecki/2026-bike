import { pinia } from '@/plugins/pinia'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/rides',
      name: 'rides',
      component: () => import('@/views/RideListView.vue'),
    },
    {
      path: '/rides/add',
      name: 'add-ride',
      component: () => import('@/views/AddRideView.vue'),
    },
    {
      path: '/rides/overlay',
      name: 'ride-overlay',
      component: () => import('@/views/RideOverlayView.vue'),
    },
    {
      path: '/rides/:id',
      name: 'ride-details',
      component: () => import('@/views/RideDetailsView.vue'),
    },
    {
      path: '/admin',
      name: 'admin-tools',
      component: () => import('@/views/AdminDashboardView.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/home',
      name: 'admin-homepage',
      component: () => import('@/views/AdminHomepageView.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/settings/locations',
      name: 'settings-locations',
      component: () => import('@/views/LocationSettingsView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)

  if ((to.meta.requiresAuth || to.meta.requiresAdmin) && !authStore.currentUser) {
    await authStore.loadCurrentUser()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
    }
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return {
      name: 'home',
    }
  }

  return true
})

export default router
