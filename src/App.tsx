import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { GraduationCap, LogOut, UserCircle, Menu, X } from 'lucide-react';
import ExamSelection from './components/ExamSelection';
import TestMode from './components/TestMode';
import Profile from './components/Profile';
import Auth from './components/Auth';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import UsersManagement from './components/admin/UsersManagement';
import QuestionsManagement from './components/admin/QuestionsManagement';
import ExamManagement from './components/admin/ExamManagement';
import FAQManagement from './components/admin/FAQManagement';
import Analytics from './components/admin/Analytics';
import Settings from './components/admin/Settings';
import PaymentPage from './components/PaymentPage';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Button } from './components/ui/button';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Navigation() {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isAdmin = user?.email === '192043@nith.ac.in';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <nav className="bg-card shadow-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                <span className="ml-2 text-lg md:text-xl font-bold text-card-foreground">Exam Predict</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-muted-foreground hover:bg-accent"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2"
                >
                  <UserCircle className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border">
            <div className="px-4 py-3 space-y-3">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block text-sm text-muted-foreground hover:text-primary"
                      onClick={toggleMenu}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    onClick={toggleMenu}
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      signOut();
                      toggleMenu();
                    }}
                    className="flex items-center gap-2 w-full justify-start"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setShowAuth(true);
                    toggleMenu();
                  }}
                  className="flex items-center gap-2 w-full"
                >
                  <UserCircle className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <Auth isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<ExamSelection />} />
              <Route 
                path="/test" 
                element={
                  <RequireAuth>
                    <TestMode />
                  </RequireAuth>
                } 
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route
                path="/payment"
                element={
                  <RequireAuth>
                    <PaymentPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <RequireAuth>
                    <AdminLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="exams" element={<ExamManagement />} />
                <Route path="questions" element={<QuestionsManagement />} />
                <Route path="faq" element={<FAQManagement />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}