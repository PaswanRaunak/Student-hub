import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  FileEdit,
  Users,
  BookOpen,
  LogOut,
  User,
  Menu,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Notes Management', href: '/admin/notes', icon: FileText },
  { name: 'PYQs Management', href: '/admin/pyqs', icon: ClipboardList },
  { name: 'Templates', href: '/admin/templates', icon: FileEdit },
  { name: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border bg-card">
        <div className="flex flex-col flex-1 p-4">
          {/* Logo */}
          <div className="flex items-center gap-2 px-3 py-4 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive">
              <Shield className="h-5 w-5 text-destructive-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">Admin Panel</span>
              <p className="text-xs text-muted-foreground">StudentHub</p>
            </div>
          </div>

          {/* Back to Student View */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Student View
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            <NavLinks />
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <div className="flex items-center gap-2 px-3 py-4 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive">
                  <Shield className="h-5 w-5 text-destructive-foreground" />
                </div>
                <span className="text-xl font-bold">Admin Panel</span>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 mb-4 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Student View
              </Link>
              <nav className="space-y-1">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/20 border border-destructive/30">
            <Shield className="h-4 w-4 text-destructive" />
            <span className="text-xs font-medium text-destructive">Admin</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-destructive text-destructive-foreground">
                    {profile?.name?.charAt(0).toUpperCase() || 'A'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
