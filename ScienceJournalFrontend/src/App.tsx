import { Navigate, Route, Routes } from 'react-router-dom'
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
import VolumesPage from './pages/VolumesPage'
import VolumeDetailPage from './pages/VolumeDetailPage'
import PublicVolumeDetailPage from './pages/PublicVolumeDetailPage'

function RequireAuth({ children }: { children: ReactElement }) {
  const tokens = api.getTokens()
  if (!tokens?.accessToken) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  const { articles, users, assignments } = journalData

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <HomePage />
          </PublicLayout>
        }
      />
      <Route
        path="/about"
        element={
          <PublicLayout>
            <AboutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/archive"
        element={
          <PublicLayout>
            <ArchivePage />
          </PublicLayout>
        }
      />
      <Route
        path="/archive/volumes/:id"
        element={
          <PublicLayout>
            <PublicVolumeDetailPage />
          </PublicLayout>
        }
      />
      <Route
        path="/editorial"
        element={
          <PublicLayout>
            <EditorialPage />
          </PublicLayout>
        }
      />
      <Route
        path="/editorial/unassigned"
        element={
          <PublicLayout>
            <EditorialUnassignedPage />
          </PublicLayout>
        }
      />
      <Route
        path="/policies"
        element={
          <PublicLayout>
            <PoliciesPage />
          </PublicLayout>
        }
      />
      <Route
        path="/contacts"
        element={
          <PublicLayout>
            <ContactsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/policies/ethics"
        element={
          <PublicLayout>
            <PolicyEthicsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/policies/ai"
        element={
          <PublicLayout>
            <PolicyAIPage />
          </PublicLayout>
        }
      />
      <Route
        path="/policies/review"
        element={
          <PublicLayout>
            <PolicyReviewPage />
          </PublicLayout>
        }
      />
      <Route
        path="/authors/requirements"
        element={
          <PublicLayout>
            <AuthorsRequirementsPage />
          </PublicLayout>
        }
      />
      <Route
        path="/authors/contract"
        element={
          <PublicLayout>
            <AuthorsContractPage />
          </PublicLayout>
        }
      />
      <Route
        path="/search"
        element={
          <PublicLayout>
            <SearchPage />
          </PublicLayout>
        }
      />
      <Route
        path="/login"
        element={
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        }
      />
      <Route
        path="/register"
        element={
          <PublicLayout>
            <RegisterPage />
          </PublicLayout>
        }
      />
      <Route
        path="/authors"
        element={
          <PublicLayout>
            <AuthorsInfoPage />
          </PublicLayout>
        }
      />
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
