import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  BarChart3,
  MessageSquareText,
  LogOut,
  Menu,
  X,
  Home,
  GraduationCap
} from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

const ADMIN_EMAIL = '192043@nith.ac.in';

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { icon: Home, label: 'Back to Home', path: '/' },
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: GraduationCap, label: 'Exams', path: '/admin/exams' },
    { icon: BookOpen, label: 'Questions', path: '/admin/questions' },
    { icon: MessageSquareText, label: 'FAQ', path: '/admin/faq' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card border-b border-border fixed top-0 left-0 right-0 z-30 px-4">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-bold text-card-foreground">Admin Panel</h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border hidden lg:block">
            <h1 className="text-xl font-bold text-card-foreground">Admin Panel</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    item.path === '/' 
                      ? 'text-primary hover:bg-primary/10'
                      : isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    item.path === '/'
                      ? 'text-primary'
                      : isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                  }`} />
                  <span className={item.path === '/' || isActive ? 'font-medium' : ''}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`
        transition-all duration-200
        lg:ml-64 min-h-screen
        ${isSidebarOpen ? 'ml-64' : 'ml-0'}
      `}>
        <div className="p-8 pt-20 lg:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;