
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
  LogOut,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    path: '/dashboard', 
    icon: LayoutDashboard, 
    label: 'Dashboard',
  },
  { 
    path: '/dashboard/customers', 
    icon: Users, 
    label: 'Clientes',
  },
  { 
    path: '/dashboard/products', 
    icon: Package, 
    label: 'Produtos',
  },
  { 
    path: '/dashboard/orders', 
    icon: ShoppingCart, 
    label: 'Pedidos',
  },
  { 
    path: '/dashboard/shipments', 
    icon: Calendar, 
    label: 'Preparando Envio',
  },
  { 
    path: '/dashboard/settings', 
    icon: Settings, 
    label: 'Configurações',
  },
];

export const DashboardSidebar = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 bg-sidebar/80 text-white hover:bg-sidebar/90"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar h-full fixed left-0 top-0 bottom-0 w-64 shadow-xl transition-all duration-300 ease-in-out z-40",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
        style={{ width: '16rem' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-2xl font-bold text-white">A&F Consultoria</h1>
            <p className="text-sm text-sidebar-foreground/80 mt-1">
              Olá, {user?.username || 'Admin'}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-white/10 transition-colors",
                        isActive ? "bg-white/15 shadow-inner" : ""
                      )}
                      onClick={() => isMobile && closeSidebar()}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="ml-3 font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border mt-auto">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border-0"
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
