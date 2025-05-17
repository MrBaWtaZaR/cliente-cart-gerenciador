
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Settings, User, Database, Key, Save } from 'lucide-react';

export const SettingsPage = () => {
  const [adminInfo, setAdminInfo] = useState({
    name: 'Admin',
    email: 'admin@example.com',
    notify: true,
    autoBackup: true,
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminInfo(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setAdminInfo(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSaveSettings = () => {
    toast.success('Configurações salvas com sucesso');
  };
  
  const handleExportData = () => {
    try {
      const customers = localStorage.getItem('customers') || '[]';
      const products = localStorage.getItem('products') || '[]';
      
      const data = {
        customers: JSON.parse(customers),
        products: JSON.parse(products),
        exportDate: new Date().toISOString(),
      };
      
      // Converter para JSON
      const jsonString = JSON.stringify(data, null, 2);
      
      // Criar um blob
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Criar URL para download
      const url = URL.createObjectURL(blob);
      
      // Criar link de download
      const a = document.createElement('a');
      a.href = url;
      a.download = `cliente-cart-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Limpar
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Dados exportados com sucesso');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    }
  };
  
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        if (jsonData.customers && jsonData.products) {
          localStorage.setItem('customers', JSON.stringify(jsonData.customers));
          localStorage.setItem('products', JSON.stringify(jsonData.products));
          
          toast.success('Dados importados com sucesso. Recarregue a página para ver as alterações.');
        } else {
          toast.error('Arquivo de dados inválido');
        }
      } catch (error) {
        console.error('Erro ao importar dados:', error);
        toast.error('Erro ao processar o arquivo');
      }
    };
    reader.readAsText(file);
    
    // Resetar o input para permitir carregar o mesmo arquivo novamente
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2" /> Configurações
        </h1>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as preferências gerais do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notify">Notificações de Novos Pedidos</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações quando novos pedidos forem criados
                  </p>
                </div>
                <Switch
                  id="notify"
                  checked={adminInfo.notify}
                  onCheckedChange={(checked) => handleSwitchChange('notify', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="autoBackup">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Criar backups automáticos dos dados periodicamente
                  </p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={adminInfo.autoBackup}
                  onCheckedChange={(checked) => handleSwitchChange('autoBackup', checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" /> Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="account" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" /> Informações da Conta
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={adminInfo.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={adminInfo.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite para alterar a senha"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme a nova senha"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>
                <Save className="h-4 w-4 mr-2" /> Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" /> Gerenciamento de Dados
              </CardTitle>
              <CardDescription>
                Exporte ou importe dados do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label>Exportar Dados</Label>
                  <p className="text-sm text-muted-foreground">
                    Baixe um backup completo de todos os dados do sistema
                  </p>
                  <Button variant="outline" onClick={handleExportData}>
                    Exportar JSON
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="importData">Importar Dados</Label>
                  <p className="text-sm text-muted-foreground">
                    Carregue um arquivo de backup para restaurar os dados
                  </p>
                  <div className="flex flex-col space-y-2">
                    <Input
                      id="importData"
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                    />
                    <p className="text-xs text-muted-foreground">
                      Atenção: Isto substituirá todos os dados existentes
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Limpar Dados</Label>
                  <p className="text-sm text-muted-foreground">
                    Remova todos os dados do sistema. Esta ação não pode ser desfeita.
                  </p>
                  <Button variant="destructive" 
                    onClick={() => {
                      if (confirm('Esta ação removerá todos os dados. Tem certeza?')) {
                        localStorage.removeItem('customers');
                        localStorage.removeItem('products');
                        toast.success('Dados limpos com sucesso. Recarregue a página para iniciar com dados vazios.');
                      }
                    }}
                  >
                    Limpar Todos os Dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" /> Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-muted-foreground">Versão: 1.0.0</p>
                <p className="text-muted-foreground">Último backup: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
