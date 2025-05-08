
import { ReactNode, useEffect } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { AuthGuard } from './AuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const isMobile = useIsMobile();
  
  // Add cleanup effect when layout unmounts
  useEffect(() => {
    return () => {
      // Clean any portal elements that might be orphaned
      const portals = document.querySelectorAll('[data-portal]');
      portals.forEach(portal => {
        if (portal && portal.parentNode) {
          try {
            portal.parentNode.removeChild(portal);
          } catch (e) {
            // Ignore errors if element was already removed
          }
        }
      });
    };
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen flex">
        <DashboardSidebar />
        <main className={`flex-1 ${isMobile ? 'pl-0' : 'md:pl-64'} pt-16 md:pt-4 transition-all duration-300 bg-background`}>
          <div className="container mx-auto p-4 md:p-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};
