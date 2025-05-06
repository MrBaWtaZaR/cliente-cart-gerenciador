
import { useState, useRef } from 'react';
import { useDataStore, Product } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Package, Search, Plus, Edit, Trash, Image as ImageIcon, Upload, Gallery } from 'lucide-react';

export const ProductsPage = () => {
  const { products, addProduct, updateProduct, deleteProduct, uploadProductImage } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    if (name === 'price' || name === 'stock') {
      const numValue = parseFloat(value);
      setNewProduct(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleAddProduct = () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    addProduct(newProduct);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      images: ['/placeholder.svg']
    });
    setIsAddingProduct(false);
  };
  
  const handleEditProduct = () => {
    if (!isEditingProduct) return;
    
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    
    updateProduct(isEditingProduct, newProduct);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      images: ['/placeholder.svg']
    });
    setIsEditingProduct(null);
  };
  
  const handleEditClick = (product: Product) => {
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      images: product.images
    });
    setIsEditingProduct(product.id);
  };
  
  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };
  
  const addImageField = () => {
    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, '/placeholder.svg']
    }));
  };
  
  const removeImageField = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
  
  const handleImageChange = (index: number, value: string) => {
    setNewProduct(prev => {
      const newImages = [...prev.images];
      newImages[index] = value;
      return {
        ...prev,
        images: newImages
      };
    });
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
  };

  const openFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-10 text-muted-foreground">
            {searchTerm ? "Nenhum produto encontrado com esses termos." : "Nenhum produto cadastrado."}
          </div>
        )}
      </div>
      
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => isEditingProduct && handleFileUpload(e, isEditingProduct)}
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
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={newProduct.price}
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
                <Button type="button" variant="outline" size="sm" onClick={addImageField}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Imagem
                </Button>
              </div>
              
              {newProduct.images.map((image, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={image}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder="URL da imagem"
                  />
                  {index > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="flex-shrink-0"
                      onClick={() => removeImageField(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Para adicionar imagens, informe as URLs de cada imagem
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingProduct(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProduct}>
              Adicionar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para editar produto */}
      <Dialog open={!!isEditingProduct} onOpenChange={() => setIsEditingProduct(null)}>
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
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={newProduct.price}
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
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={openFileUpload}
                  >
                    <Upload className="h-4 w-4 mr-1" /> Enviar Imagens
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addImageField}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adicionar URL
                  </Button>
                </div>
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
                      onClick={() => removeImageField(index)}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Barra para adicionar URLs manualmente */}
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar URL da imagem"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      setNewProduct(prev => ({
                        ...prev,
                        images: [...prev.images, e.target.value]
                      }));
                      e.target.value = '';
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
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
              <p><strong>Preço:</strong> {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(productToDelete.price)}</p>
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
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => (
  <Card className="overflow-hidden flex flex-col">
    <div className="relative aspect-video bg-muted">
      {product.images && product.images[0] ? (
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
      {product.images && product.images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          +{product.images.length - 1} fotos
        </div>
      )}
    </div>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{product.name}</CardTitle>
    </CardHeader>
    <CardContent className="pb-2 flex-grow">
      <p className="text-xl font-bold text-primary">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(product.price)}
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
