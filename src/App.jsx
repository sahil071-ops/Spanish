import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import BottomNav from './components/BottomNav.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import UpdateBanner from './components/UpdateBanner.jsx'
import HomePage from './pages/HomePage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import FlashcardsPage from './pages/FlashcardsPage.jsx'
import GrammarPage from './pages/GrammarPage.jsx'
import ReadingPage from './pages/ReadingPage.jsx'
import ListeningPage from './pages/ListeningPage.jsx'
import MockExamPage from './pages/MockExamPage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import VocabularyPage from './pages/VocabularyPage.jsx'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 pb-16">
          <OfflineBanner />
          <UpdateBanner />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/practice/flashcards" element={<FlashcardsPage />} />
            <Route path="/practice/grammar" element={<GrammarPage />} />
            <Route path="/practice/reading" element={<ReadingPage />} />
            <Route path="/practice/listening" element={<ListeningPage />} />
            <Route path="/practice/mock-exam" element={<MockExamPage />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  )
}
