import { useState, useRef } from 'react';
import { useDataStore, Product } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Package, Search, Plus, Edit, Trash, Image as ImageIcon, Upload } from 'lucide-react';
import { ProductImageCarousel } from '@/components/ProductImageCarousel';
import { formatPriceDisplay, handlePriceInput } from '@/components/PriceFormatter';

export const ProductsPage = () => {
  const { products, addProduct, updateProduct, deleteProduct, uploadProductImage } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    images: ['/placeholder.svg']
  });
  
  // Filtrar produtos de acordo com a pesquisa
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower)
    );
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validar inputs numéricos
    if (name === 'price') {
      handlePriceInput(e as React.ChangeEvent<HTMLInputElement>, (numValue) => {
        setNewProduct(prev => ({
          ...prev,
          price: numValue
        }));
      });
    } else if (name === 'stock') {
      const numValue = parseInt(value);
      setNewProduct(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAddProductFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const newImages = [...newProduct.images.filter(img => img !== '/placeholder.svg')];
    
    // Exibe mensagem de carregamento para uploads
    toast.loading(`Processando ${files.length} imagem(ns)...`);
    
    try {
      // Generate temporary URLs for preview
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tempUrl = URL.createObjectURL(file);
        newImages.push(tempUrl);
        
        // Store the File object for later upload
        (window as any)[`tempFile_${tempUrl}`] = file;
      }
      
      setNewProduct(prev => ({
        ...prev,
        images: newImages.length ? newImages : ['/placeholder.svg']
      }));
      
      if (addFileInputRef.current) addFileInputRef.current.value = '';
      toast.dismiss();
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      toast.error('Erro ao processar imagens');
      if (addFileInputRef.current) addFileInputRef.current.value = '';
    }
  };
  
  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    // Se houver imagens temporárias, precisamos fazer o upload delas primeiro
    const finalProduct = { ...newProduct };
    let processedImages: string[] = [];
    
    // Mostra o toast de carregamento
    toast.loading('Processando imagens e salvando produto...');
    
    try {
      // Processa cada imagem
      for (const image of newProduct.images) {
        if (image === '/placeholder.svg') {
          processedImages.push(image);
        } else if (image.startsWith('blob:')) {
          // Recupera o arquivo temporário armazenado anteriormente
          const tempFile = (window as any)[`tempFile_${image}`];
          
          if (tempFile) {
            // Gera um ID temporário para o produto se ainda não existir
            const tempProductId = 'temp_' + Date.now().toString(36);
            
            // Faz o upload da imagem e obtém a URL pública
            const publicUrl = await uploadProductImage(tempProductId, tempFile);
            processedImages.push(publicUrl);
            
            // Limpa a referência ao arquivo temporário
            delete (window as any)[`tempFile_${image}`];
            
            // Revoga a URL do blob para liberar memória
            URL.revokeObjectURL(image);
          } else {
            console.error(`Arquivo temporário não encontrado para ${image}`);
            // Se não conseguiu encontrar o arquivo, tenta usar a URL diretamente
            processedImages.push(image);
          }
        } else {
          // Imagem já processada
          processedImages.push(image);
        }
      }
      
      // Atualiza o produto com as imagens processadas
      finalProduct.images = processedImages;
      
      // Adiciona o produto com as imagens processadas
      addProduct(finalProduct);
      
      // Reseta o formulário
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        images: ['/placeholder.svg']
      });
      
      // Fecha o modal
      setIsAddingProduct(false);
      
      toast.dismiss();
      toast.success('Produto adicionado com sucesso');
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      toast.dismiss();
      toast.error('Erro ao processar imagens e salvar produto');
    }
  };
  
  const handleEditProduct = async () => {
    if (!isEditingProduct) return;
    
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    // Se houver imagens temporárias, precisamos fazer o upload delas primeiro
    const finalProduct = { ...newProduct };
    let processedImages: string[] = [];
    
    // Mostra o toast de carregamento
    toast.loading('Processando imagens e atualizando produto...');
    
    try {
      // Processa cada imagem
      for (const image of newProduct.images) {
        if (image === '/placeholder.svg') {
          processedImages.push(image);
        } else if (image.startsWith('blob:')) {
          // Recupera o arquivo temporário armazenado anteriormente
          const tempFile = (window as any)[`tempFile_${image}`];
          
          if (tempFile) {
            // Faz o upload da imagem e obtém a URL pública
            const publicUrl = await uploadProductImage(isEditingProduct, tempFile);
            processedImages.push(publicUrl);
            
            // Limpa a referência ao arquivo temporário
            delete (window as any)[`tempFile_${image}`];
            
            // Revoga a URL do blob para liberar memória
            URL.revokeObjectURL(image);
          } else {
            console.error(`Arquivo temporário não encontrado para ${image}`);
            processedImages.push(image);
          }
        } else {
          // Imagem já processada
          processedImages.push(image);
        }
      }
      
      // Atualiza o produto com as imagens processadas
      finalProduct.images = processedImages;
      
      // Atualiza o produto
      updateProduct(isEditingProduct, finalProduct);
      
      // Reseta o formulário
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        images: ['/placeholder.svg']
      });
      
      // Fecha o modal de edição
      setIsEditingProduct(null);
      
      toast.dismiss();
      toast.success('Produto atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao processar imagens:', error);
      toast.dismiss();
      toast.error('Erro ao processar imagens e atualizar produto');
    }
  };
  
  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    toast.loading(`Enviando ${files.length} imagem(s)...`);
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const url = await uploadProductImage(productId, file);
        
        if (isEditingProduct === productId) {
          setNewProduct(prev => ({
            ...prev,
            images: [...prev.images.filter(img => img !== '/placeholder.svg'), url]
          }));
        }
      } catch (error) {
        console.error("Erro ao fazer upload:", error);
        toast.error("Erro ao fazer upload da imagem");
      }
    }
    
    toast.dismiss();
    toast.success("Imagens enviadas com sucesso");
    
    // Limpar o input de arquivo
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addFileInputRef.current) addFileInputRef.current.value = '';
  };

  const openFileUpload = (isAdding = false) => {
    if (isAdding && addFileInputRef.current) {
      addFileInputRef.current.click();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleEditClick = (product: Product) => {
    setIsEditingProduct(product.id);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center">
          <Package className="h-6 w-6 mr-2" /> Produtos
        </h1>

        <Button onClick={() => setIsAddingProduct(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Produto
        </Button>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onEdit={() => handleEditClick(product)} 
              onDelete={() => setProductToDelete(product)}
              onView={() => setSelectedProduct(product)}
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-10 text-muted-foreground">
            {searchTerm ? "Nenhum produto encontrado com esses termos." : "Nenhum produto cadastrado."}
          </div>
        )}
      </div>
      
      {/* Input de arquivo oculto para edição */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => isEditingProduct && handleFileUpload(e, isEditingProduct)}
      />
      
      {/* Input de arquivo oculto para adição */}
      <input
        ref={addFileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleAddProductFileUpload}
      />
      
      {/* Modal para adicionar produto */}
      <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" /> Adicionar Produto
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do novo produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Nome do produto"
                value={newProduct.name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrição do produto"
                value={newProduct.description}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço *</Label>
                <Input
                  id="price"
                  name="price"
                  placeholder="R$ 0,00"
                  value={formatPriceDisplay(newProduct.price)}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Imagens</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openFileUpload(true)}
                >
                  <Upload className="h-4 w-4 mr-1" /> Enviar Imagens
                </Button>
              </div>
              
              {newProduct.images[0] === '/placeholder.svg' ? (
                <div className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                     onClick={() => openFileUpload(true)}>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Clique para enviar imagens</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporta JPG, PNG, WEBP
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3">
                  {newProduct.images.map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square bg-muted rounded-md overflow-hidden border"
                    >
                      <img 
                        src={image} 
                        alt={`Imagem ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewProduct(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index).length ? 
                              prev.images.filter((_, i) => i !== index) : 
                              ['/placeholder.svg']
                          }));
                        }}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddingProduct(false);
              setNewProduct({
                name: '',
                description: '',
                price: 0,
                stock: 0,
                images: ['/placeholder.svg']
              });
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddProduct}>
              Adicionar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para editar produto */}
      <Dialog open={!!isEditingProduct} onOpenChange={(open) => {
        if (!open) {
          setIsEditingProduct(null);
          setNewProduct({
            name: '',
            description: '',
            price: 0,
            stock: 0,
            images: ['/placeholder.svg']
          });
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2" /> Editar Produto
            </DialogTitle>
            <DialogDescription>
              Atualize as informações do produto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Nome do produto"
                value={newProduct.name}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                name="description"
                placeholder="Descrição do produto"
                value={newProduct.description}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Preço *</Label>
                <Input
                  id="edit-price"
                  name="price"
                  placeholder="R$ 0,00"
                  value={formatPriceDisplay(newProduct.price)}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Estoque</Label>
                <Input
                  id="edit-stock"
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newProduct.stock}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Imagens</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openFileUpload()}
                >
                  <Upload className="h-4 w-4 mr-1" /> Enviar Imagens
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3">
                {newProduct.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square bg-muted rounded-md overflow-hidden border"
                  >
                    <img 
                      src={image} 
                      alt={`Imagem ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        setNewProduct(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index).length ? 
                            prev.images.filter((_, i) => i !== index) : 
                            ['/placeholder.svg']
                        }));
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingProduct(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEditProduct}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash className="h-5 w-5 mr-2 text-destructive" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este produto?
            </DialogDescription>
          </DialogHeader>
          
          {productToDelete && (
            <div className="py-4">
              <p><strong>Nome:</strong> {productToDelete.name}</p>
              <p><strong>Preço:</strong> {formatPriceDisplay(productToDelete.price)}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              Excluir Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para visualizar imagens do produto em tamanho completo */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => {
        if (!open) {
          setSelectedProduct(null);
        }
      }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              {selectedProduct?.description || "Sem descrição disponível"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="w-full max-w-2xl mx-auto">
                <ProductImageCarousel 
                  images={selectedProduct.images} 
                  autoPlayInterval={3000}
                />
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estoque: <span className={selectedProduct.stock > 0 ? "text-green-600" : "text-red-600"}>
                      {selectedProduct.stock} unidades
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-primary">
                    {formatPriceDisplay(selectedProduct.price)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const ProductCard = ({ product, onEdit, onDelete, onView }: ProductCardProps) => (
  <Card className="overflow-hidden flex flex-col">
    <div 
      className="relative aspect-video bg-muted cursor-pointer"
      onClick={onView}
    >
      <ProductImageCarousel images={product.images} autoPlayInterval={5000} />
    </div>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{product.name}</CardTitle>
    </CardHeader>
    <CardContent className="pb-2 flex-grow">
      <p className="text-xl font-bold text-primary">
        {formatPriceDisplay(product.price)}
      </p>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
        {product.description || "Sem descrição disponível"}
      </p>
      <p className="text-sm mt-2">
        <strong>Estoque:</strong>{" "}
        <span className={`${product.stock > 0 ? "text-green-600" : "text-destructive"}`}>
          {product.stock} unidades
        </span>
      </p>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline" size="sm" onClick={onDelete}>
        <Trash className="h-4 w-4 mr-2" /> Excluir
      </Button>
      <Button size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-2" /> Editar
      </Button>
    </CardFooter>
  </Card>
);
