
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuthStore();
  const redirectedRef = useRef(false);

  // Check if user is already authenticated, if so redirect to dashboard
  useEffect(() => {
    if (user?.isAuthenticated && !redirectedRef.current) {
      redirectedRef.current = true;
      console.log("User already authenticated, redirecting to dashboard");
      navigate('/dashboard');
    }
    
    return () => {
      redirectedRef.current = false;
    };
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        toast.success('Login realizado com sucesso');
        // Set a flag to prevent double redirects
        redirectedRef.current = true;
        navigate('/dashboard');
      } else {
        toast.error('Credenciais inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Ocorreu um erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 z-0"></div>
          <CardHeader className="space-y-1 text-center relative z-10">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">A&F Consultoria</CardTitle>
            <CardDescription>
              Digite suas credenciais para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="username">Email ou usuário</Label>
                <Input
                  id="username"
                  placeholder="exemplo@afconsultoria.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-white/70 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/70 backdrop-blur-sm"
                />
              </div>
            </CardContent>
            <CardFooter className="relative z-10">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 button-glow" 
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
