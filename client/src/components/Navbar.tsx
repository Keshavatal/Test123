import { Link } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { 
  Menu, 
  X, 
  Home as HomeIcon, 
  Smile as SmileIcon, 
  HeartPulse as HeartPulseIcon, 
  Book as BookIcon, 
  User as UserIcon,
  MessageCircle as MessageCircleIcon,
  LogOut,
  Target,
  Sun as SunIcon,
  BarChart as BarChartIcon
} from 'lucide-react';

export function Navigation() {
  const { user, logout } = useAuth();

  const [open, setOpen] = React.useState(false);

  // Menu items
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { path: '/mood', label: 'Mood', icon: <SmileIcon className="h-5 w-5" /> },
    { path: '/exercises', label: 'Exercises', icon: <HeartPulseIcon className="h-5 w-5" /> },
    { path: '/goals', label: 'Goals', icon: <Target className="h-5 w-5" /> },
    { path: '/journal', label: 'Journal', icon: <BookIcon className="h-5 w-5" /> },
    { path: '/affirmations', label: 'Affirmations', icon: <SunIcon className="h-5 w-5" /> },
    { path: '/reports/weekly', label: 'Reports', icon: <BarChartIcon className="h-5 w-5" /> },
    { path: '/chat', label: 'Chat', icon: <MessageCircleIcon className="h-5 w-5" /> },
    { path: '/profile', label: 'Profile', icon: <UserIcon className="h-5 w-5" /> },
  ];

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {/* Logo */}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex space-x-4">
              {menuItems.map((item) => (
                <Link key={item.label} href={item.path} className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link key={item.label} href={item.path} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-700 pt-4 pb-3">
            {user && (
                <div className="px-4">
                  <Button variant="destructive" onClick={logout}>
                    Log out
                  </Button>
                </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}