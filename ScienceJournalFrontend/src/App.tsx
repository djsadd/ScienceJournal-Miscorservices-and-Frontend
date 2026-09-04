import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import './App.css'
import { MainLayout } from './app/layout/MainLayout'
import { PublicLayout } from './app/layout/PublicLayout'
import { Dashboard } from './pages/Dashboard'
import { AuthorSubmissions } from './features/authors/AuthorSubmissions'
// import { ReviewerAssignments } from './features/reviewers/ReviewerAssignments'
import MyReviewsPage from './pages/MyReviewsPage'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { ArchivePage } from './pages/ArchivePage'
import { EditorialPage } from './pages/EditorialPage'
import { PoliciesPage } from './pages/PoliciesPage'
import { ContactsPage } from './pages/ContactsPage'
import { SearchPage } from './pages/SearchPage'
import { AuthorsInfoPage } from './pages/AuthorsInfoPage'
import { PolicyEthicsPage } from './pages/PolicyEthicsPage'
import { PolicyAIPage } from './pages/PolicyAIPage'
import { PolicyReviewPage } from './pages/PolicyReviewPage'
import { AuthorsRequirementsPage } from './pages/AuthorsRequirementsPage'
import { AuthorsContractPage } from './pages/AuthorsContractPage'
import { AuthorsSubmissionPage } from './pages/AuthorsSubmissionPage'
import { ProfilePage } from './pages/ProfilePage'
import { ArticleDetailsPage } from './pages/ArticleDetailsPage'
import { MyArticleDetailsPage } from './pages/MyArticleDetailsPage'
import { ReviewFormPage } from './pages/ReviewFormPage'
import ReviewDetailsPage from './pages/ReviewDetailsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { journalData } from './data/mockData'
import { LayoutBoard } from './features/designers/LayoutBoard'
import { api } from './api/client'
import type { ReactElement } from 'react'
import EditorialUnassignedPage from './pages/EditorialUnassignedPage'
import EditorialPortfolioPage from './pages/EditorialPortfolioPage'
import EditorArticleDetailPage from './pages/EditorArticleDetailPage'
import EditorArticleVersionPage from './pages/EditorArticleVersionPage'
import EditorPublishedArticleEditPage from './pages/EditorPublishedArticleEditPage'
import VolumesPage from './pages/VolumesPage'
import VolumeDetailPage from './pages/VolumeDetailPage'
import PublicVolumeDetailPage from './pages/PublicVolumeDetailPage'
import PublicArticleDetailPage from './pages/PublicArticleDetailPage'
import VolumeEditPage from './pages/VolumeEditPage'
import NotificationsPage from './pages/NotificationsPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import QuickPublishPage from './pages/QuickPublishPage'
import AdminUsersPage from './pages/AdminUsersPage'
import RoleRequestsPage from './pages/RoleRequestsPage'

function RequireAuth({ children }: { children: ReactElement }) {
  const tokens = api.getTokens()
  if (!tokens?.accessToken) {
    return <Navigate to="/login" replace />
  }
  return children
}

function isUrlLang(value: string | undefined) {
  return value === 'ru' || value === 'kz' || value === 'en'
}

function PublicRoute({ children }: { children: ReactElement }) {
  const { urlLang } = useParams()
  if (urlLang && !isUrlLang(urlLang)) {
    return <Navigate to="/" replace />
  }
  return <PublicLayout>{children}</PublicLayout>
}

const publicRoutes: { path: string; element: ReactElement }[] = [
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/archive', element: <ArchivePage /> },
  { path: '/archive/volumes/:id', element: <PublicVolumeDetailPage /> },
  { path: '/archive/volumes/:volumeId/articles/:articleId', element: <PublicArticleDetailPage /> },
  { path: '/editorial', element: <EditorialPage /> },
  { path: '/editorial/unassigned', element: <EditorialUnassignedPage /> },
  { path: '/policies', element: <PoliciesPage /> },
  { path: '/contacts', element: <ContactsPage /> },
  { path: '/policies/ethics', element: <PolicyEthicsPage /> },
  { path: '/policies/ai', element: <PolicyAIPage /> },
  { path: '/policies/review', element: <PolicyReviewPage /> },
  { path: '/authors/requirements', element: <AuthorsRequirementsPage /> },
  { path: '/authors/contract', element: <AuthorsContractPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/authors', element: <AuthorsInfoPage /> },
  { path: '/auth/verify-email', element: <VerifyEmailPage /> },
]

function localizedRoutePath(path: string) {
  return path === '/' ? '/:urlLang' : `/:urlLang${path}`
}

function App() {
  const { articles, users, assignments } = journalData

  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<PublicRoute>{route.element}</PublicRoute>}
        />
      ))}
      {publicRoutes.map((route) => (
        <Route
          key={`localized-${route.path}`}
          path={localizedRoutePath(route.path)}
          element={<PublicRoute>{route.element}</PublicRoute>}
        />
      ))}
      <Route
        path="/cabinet"
        element={
          <RequireAuth>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/submissions"
        element={
          <RequireAuth>
            <MainLayout>
              <AuthorSubmissions />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/my-articles/:id"
        element={
          <RequireAuth>
            <MainLayout>
              <MyArticleDetailsPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/submission"
        element={
          <RequireAuth>
            <MainLayout>
              <AuthorsSubmissionPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/editorial2"
        element={
          <RequireAuth>
            <MainLayout>
              <EditorialPortfolioPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/editorial2/:id"
        element={
          <RequireAuth>
            <MainLayout>
              <EditorArticleDetailPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/editorial2/:id/edit"
        element={
          <RequireAuth>
            <MainLayout>
              <EditorPublishedArticleEditPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/editorial2/:id/versions/:versionId"
        element={
          <RequireAuth>
            <MainLayout>
              <EditorArticleVersionPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/layout"
        element={
          <RequireAuth>
            <MainLayout>
              <LayoutBoard articles={articles} />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/volumes"
        element={
          <RequireAuth>
            <MainLayout>
              <VolumesPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/volumes/:id"
        element={
          <RequireAuth>
            <MainLayout>
              <VolumeDetailPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/volumes/:id/edit"
        element={
          <RequireAuth>
            <MainLayout>
              <VolumeEditPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/quick-publish"
        element={
          <RequireAuth>
            <MainLayout>
              <QuickPublishPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/notifications"
        element={
          <RequireAuth>
            <MainLayout>
              <NotificationsPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/admin/users"
        element={
          <RequireAuth>
            <MainLayout>
              <AdminUsersPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/role-requests"
        element={
          <RequireAuth>
            <MainLayout>
              <RoleRequestsPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/reviews"
        element={
          <RequireAuth>
            <MainLayout>
              <MyReviewsPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/reviews/:id"
        element={
          <RequireAuth>
            <MainLayout>
              <ReviewDetailsPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/articles/:id"
        element={
          <RequireAuth>
            <MainLayout>
              <ArticleDetailsPage articles={articles} users={users} assignments={assignments} />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/review/:assignmentId"
        element={
          <RequireAuth>
            <MainLayout>
              <ReviewFormPage assignments={assignments} articles={articles} users={users} />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/cabinet/profile"
        element={
          <RequireAuth>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
