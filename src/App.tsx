
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { QuizAvailabilityProvider } from "./contexts/QuizAvailabilityContext";
import { TransactionProvider } from "./contexts/TransactionContext";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Splash from "./pages/Splash";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import Quizzes from "./pages/Quizzes";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import QuizDetail from "./pages/QuizDetail";
import QuizPlay from "./pages/QuizPlay";
import Results from "./pages/Results";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminQuizzes from "./pages/AdminQuizzes";
import AdminQuizCreate from "./pages/AdminQuizCreate";
import AdminPayments from "./pages/AdminPayments";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import QuizPlayEnhanced from "./pages/QuizPlayEnhanced";
import AdminGuard from "./components/guards/AdminGuard";
import EmailVerify from "./pages/EmailVerify";
import About from "./pages/About";
import HowToPlay from "./pages/HowToPlay";
import Disclaimer from "./pages/Disclaimer";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TransactionProvider>
          <NotificationProvider>
            <QuizAvailabilityProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Splash />} />
                <Route path="register" element={<Register />} />
                <Route path="login" element={<Login />} />
                <Route path="email-verify" element={<EmailVerify />} />
                <Route path="about" element={<About />} />
                <Route path="how-to-play" element={<HowToPlay />} />
                <Route path="disclaimer" element={<Disclaimer />} />
                <Route path="contact" element={<Contact />} />
                <Route path="home" element={<Home />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="wallet/deposit" element={<Deposit />} />
                <Route path="wallet/withdraw" element={<Withdraw />} />
                <Route path="quizzes" element={<Quizzes />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="quiz/:quizId" element={<QuizDetail />} />
                <Route path="quiz/:quizId/play" element={<QuizPlayEnhanced />} />
                <Route path="quiz/:quizId/results" element={<Results />} />
                {/* Wrap admin pages with AdminGuard to ensure stable hook order */}
                <Route path="admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                <Route path="admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
                <Route path="admin/quizzes" element={<AdminGuard><AdminQuizzes /></AdminGuard>} />
                <Route path="admin/quiz/create" element={<AdminGuard><AdminQuizCreate /></AdminGuard>} />
                <Route path="admin/quiz/:id/edit" element={<AdminGuard><AdminQuizCreate /></AdminGuard>} />
                <Route path="admin/payments" element={<AdminGuard><AdminPayments /></AdminGuard>} />
                <Route path="admin/announcements" element={<AdminGuard><AdminAnnouncements /></AdminGuard>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            </BrowserRouter>
            </QuizAvailabilityProvider>
          </NotificationProvider>
        </TransactionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
