import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Exercises", path: "/exercises" },
    { name: "Journal", path: "/journal" },
    { name: "Progress", path: "/progress" },
  ];

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ""}`;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="h-10 w-10 text-primary animate-float" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor"/>
          </svg>
          <Link href="/">
            <h1 className="ml-2 text-2xl font-quicksand font-bold text-primary cursor-pointer">MindfulPath</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {user && navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a className={`font-quicksand font-medium ${location === item.path ? 'text-primary' : 'text-textColor hover:text-primary'} transition duration-300`}>
                {item.name}
              </a>
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          {user ? (
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0">
                    <div className="flex items-center">
                      <Avatar className="w-10 h-10 bg-accent mr-2">
                        <AvatarFallback className="font-quicksand font-medium text-primary">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-quicksand">{user.firstName}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="font-quicksand">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="font-quicksand bg-primary hover:bg-primary/80">Register</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6 text-primary" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 bg-background border-t">
          <nav className="flex flex-col space-y-3">
            {user ? (
              <>
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path}>
                    <a 
                      className={`font-quicksand font-medium py-2 px-4 rounded ${location === item.path ? 'bg-primary/10 text-primary' : 'text-textColor'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  </Link>
                ))}
                <Button 
                  variant="ghost" 
                  className="font-quicksand justify-start"
                  onClick={() => { 
                    logout(); 
                    setMobileMenuOpen(false); 
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a 
                    className="font-quicksand font-medium py-2 px-4 rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </a>
                </Link>
                <Link href="/register">
                  <a 
                    className="font-quicksand font-medium py-2 px-4 rounded bg-primary text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </a>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
