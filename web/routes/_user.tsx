import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { ShareAByteLogo } from "@/components/ShareAByteLogo";
import { useSignOut } from "@gadgetinc/react";
import {
  Bell,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PlusSquare,
  Search,
  Trophy,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  Link,
  Outlet,
  redirect,
  useLocation,
  useOutletContext,
} from "react-router";
import type { RootOutletContext } from "../root";
import type { Route } from "./+types/_user";

export const loader = async ({ context }: Route.LoaderArgs) => {
  const { session, gadgetConfig } = context;

  const userId = session?.get("user");
  const user = userId ? await context.api.user.findOne(userId) : undefined;

  if (!user) {
    return redirect(gadgetConfig.authentication!.signInPath);
  }

  // Fetch unread notifications count
  const unreadNotifications = userId 
    ? await context.api.notification.findMany({
        filter: {
          recipientId: { equals: userId },
          isRead: { equals: false }
        }
      })
    : [];
  
  const unreadNotificationsCount = unreadNotifications.length;

  return {
    user,
    unreadNotificationsCount
  };
};

export type AuthOutletContext = RootOutletContext & {
  user?: any;
};

const UserMenu = ({ user }: { user: any }) => {
  const [userMenuActive, setUserMenuActive] = useState(false);
  const signOut = useSignOut();

  const getInitials = () => {
    return (
      (user.firstName?.slice(0, 1) ?? "") + (user.lastName?.slice(0, 1) ?? "")
    ).toUpperCase();
  };

  return (
    <DropdownMenu open={userMenuActive} onOpenChange={setUserMenuActive}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 hover:bg-accent">
          <Avatar>
            {user.profilePicture?.url ? (
              <AvatarImage
                src={user.profilePicture.url}
                alt={user.firstName ?? user.email}
              />
            ) : (
              <AvatarFallback>{getInitials()}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm font-medium md:inline hidden">
            {user.firstName ?? user.email}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={signOut}
          className="flex items-center text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NavBar = ({ user, unreadNotificationsCount = 0 }: { user: any, unreadNotificationsCount?: number }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: "/signed-in", icon: <Home className="h-5 w-5" />, label: "Home" },
    { to: "/post", icon: <PlusSquare className="h-5 w-5" />, label: "Post" },
    { to: "/search", icon: <Search className="h-5 w-5" />, label: "Find" },
    { to: "/direct-messages", icon: <MessageSquare className="h-5 w-5" />, label: "Messages" },
    { to: "/leaderboard", icon: <Trophy className="h-5 w-5" />, label: "Leaderboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-10 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <ShareAByteLogo size="small" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 flex-grow justify-end mr-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}
            <Link
              to="/notifications"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive("/notifications")
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <div className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </div>
              <span className="ml-2">Notifications</span>
            </Link>
          </nav>

          {/* User Menu - Always visible */}
          <div className="hidden md:block">
            <UserMenu user={user} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 hover:bg-accent"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            
            <div className="ml-4">
              <UserMenu user={user} />
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden absolute left-0 right-0 bg-background border-b shadow-lg transition-transform duration-200 ease-in-out z-20 ${
            mobileMenuOpen ? "transform translate-y-0" : "transform -translate-y-full h-0 overflow-hidden"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </Link>
            ))}
            <Link 
              to="/notifications"
              className="w-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center w-full justify-start px-3 py-2 rounded-md text-sm font-medium relative"
              >
                <Bell className="h-5 w-5 mr-2" />
                Notifications
                {unreadNotificationsCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default function ({ loaderData }: Route.ComponentProps) {
  const user = "user" in loaderData ? loaderData.user : undefined;
  const unreadNotificationsCount = "unreadNotificationsCount" in loaderData ? loaderData.unreadNotificationsCount : 0;
  const rootOutletContext = useOutletContext<RootOutletContext>();

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 pb-6 md:pb-8">
          <Outlet
            context={{ ...rootOutletContext, user } as AuthOutletContext}
          />
          <Toaster richColors />
        </div>
      </main>
    </div>
  );
}
