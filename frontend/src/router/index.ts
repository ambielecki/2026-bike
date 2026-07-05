import { createRouter, createWebHistory } from 'vue-router'
import AddRideView from '@/views/AddRideView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import PlaceholderView from '@/views/PlaceholderView.vue'
import RegisterView from '@/views/RegisterView.vue'
import RideDetailsView from '@/views/RideDetailsView.vue'
import RideListView from '@/views/RideListView.vue'
import RideOverlayView from '@/views/RideOverlayView.vue'

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
      component: PlaceholderView,
      props: {
        title: 'Admin Tools',
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: PlaceholderView,
      props: {
        title: 'Settings',
      },
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

export default router
