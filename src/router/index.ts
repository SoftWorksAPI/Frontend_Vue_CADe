import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/Login.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/Dashboard.vue')
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('@/pages/Files.vue')
    },
    {
      path: '/files/:id',
      name: 'file-detail',
      component: () => import('@/pages/FileDetail.vue'),
      props: true
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/pages/Reports.vue')
    },
    {
      path: '/reports/:id',
      name: 'report-detail',
      component: () => import('@/pages/ReportDetail.vue'),
      props: true
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/pages/Users.vue'),
      meta: { admin: true }
    },
    {
      path: '/norm-files',
      name: 'norm-files',
      component: () => import('@/pages/NormFiles.vue'),
      meta: { admin: true }
    },
    {
      path: '/system',
      name: 'system',
      component: () => import('@/pages/SystemHealth.vue'),
      meta: { admin: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/Profile.vue')
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) return true

  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.admin && !auth.isAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
