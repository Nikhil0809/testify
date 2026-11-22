import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  LayoutDashboard,
  History,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ListChecks,
  Users,
  BarChart3,
  ChevronsLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'Test History', icon: History },
];

const adminLinks = [
  { to: '/admin', label: 'Overview', icon: BarChart3 },
  { to: '/admin/questions', label: 'Questions', icon: ListChecks },
  { to: '/admin/students', label: 'Students', icon: Users },
];

const SidebarContent = ({ collapsed, onNavigate, role }) => {
  const links = role === 'admin' ? adminLinks : studentLinks;
  return (
    <div className="flex h-full flex-col">
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-display text-lg font-extrabold leading-none text-white">Testify</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Online Tests</p>
          </div>
        )}
      </div>

      <nav className="mt-2 flex-1 space-y-1.5 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? link.label : undefined}
          >
            <link.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1.5 border-t border-white/10 p-3">
        <NavLink
          to={role === 'admin' ? '/dashboard' : '/admin'}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? (role === 'admin' ? 'Student view' : 'Admin panel') : undefined}
        >
          <ShieldCheck className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{role === 'admin' ? 'Student View' : 'Admin Panel'}</span>}
        </NavLink>
      </div>
    </div>
  );
};

const DashboardLayout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useDocumentTitle(title);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/10 bg-navy-900/70 backdrop-blur-2xl transition-all duration-300 lg:flex ${
          collapsed ? 'w-[84px]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} role={user?.role} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-navy-800 text-slate-400 shadow-soft transition hover:text-white lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronsLeft
            className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-navy-950/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-navy-900/95 backdrop-blur-2xl lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
                role={user?.role}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-950/70 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 hover:text-white lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <p className="font-display text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-slate-500">Mini Online Test Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white leading-tight">{user?.name}</p>
                <p className="text-xs capitalize text-slate-500">{user?.role}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient font-display text-sm font-bold text-white shadow-glow">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
