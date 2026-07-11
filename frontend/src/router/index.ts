import { pinia } from '@/plugins/pinia'
import { useAuthStore } from '@/stores/auth'
import { createRouter, createWebHistory } from 'vue-router'
import AdminDashboardView from '@/views/AdminDashboardView.vue'
import AdminHomepageView from '@/views/AdminHomepageView.vue'
import AddRideView from '@/views/AddRideView.vue'
import HomeView from '@/views/HomeView.vue'
import LocationSettingsView from '@/views/LocationSettingsView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import RideDetailsView from '@/views/RideDetailsView.vue'
import RideListView from '@/views/RideListView.vue'
import RideOverlayView from '@/views/RideOverlayView.vue'
import SettingsView from '@/views/SettingsView.vue'

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
      component: RideListView,
    },
    {
      path: '/rides/add',
      name: 'add-ride',
      component: AddRideView,
    },
    {
      path: '/rides/overlay',
      name: 'ride-overlay',
      component: RideOverlayView,
    },
    {
      path: '/rides/:id',
      name: 'ride-details',
      component: RideDetailsView,
    },
    {
      path: '/admin',
      name: 'admin-tools',
      component: AdminDashboardView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/home',
      name: 'admin-homepage',
      component: AdminHomepageView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/settings/locations',
      name: 'settings-locations',
      component: LocationSettingsView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
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
