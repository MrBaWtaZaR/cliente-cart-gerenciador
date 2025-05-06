
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  LayoutDashboard,
  Users,
  Package,
  Settings,
  ShoppingCart,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const DashboardSidebar = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { 
      path: '/dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      label: 'Dashboard',
    },
    { 
      path: '/dashboard/customers', 
      icon: <Users className="h-5 w-5" />, 
      label: 'Clientes',
    },
    { 
      path: '/dashboard/products', 
      icon: <Package className="h-5 w-5" />, 
      label: 'Produtos',
    },
    { 
      path: '/dashboard/orders', 
      icon: <ShoppingCart className="h-5 w-5" />, 
      label: 'Pedidos',
    },
    { 
      path: '/dashboard/settings', 
      icon: <Settings className="h-5 w-5" />, 
      label: 'Configurações',
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      <aside
        className={cn(
          "bg-sidebar h-full fixed left-0 top-0 bottom-0 w-64 shadow-lg transition-transform duration-300 ease-in-out z-40",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <h1 className="text-2xl font-bold text-primary">Gestão Clientes</h1>
            <p className="text-sm text-sidebar-foreground">
              Olá, {user?.username || 'Admin'}
            </p>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => cn(
                      "flex items-center p-3 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => isMobile && setIsOpen(false)}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-sidebar-border mt-auto">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sair</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
