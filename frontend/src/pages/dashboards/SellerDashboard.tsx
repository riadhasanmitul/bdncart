import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SellerDashboard = () => {
  const { user } = useAuth();
  
  // Dashboard states
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // Form states
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    categoryId: '',
    price: '',
    stockQuantity: '',
    sku: '',
    imageUrl: ''
  });

  useEffect(() => {
    // Fetch categories for the dropdown
    const fetchCategories = async () => {
      try {
        const response = await api.get('/products/categories');
        setCategories(response.data.data.categories);
        if (response.data.data.categories.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: response.data.data.categories[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };

    const fetchMyProducts = async () => {
      if (!user?.id) return;
      try {
        const response = await api.get(`/products?sellerId=${user.id}`);
        setMyProducts(response.data.data.products);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchCategories();
    fetchMyProducts();
  }, [user?.id]);

  const fetchMyProductsRefresh = async () => {
    if (!user?.id) return;
    try {
      const response = await api.get(`/products?sellerId=${user.id}`);
      setMyProducts(response.data.data.products);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const handleEdit = async (product: any) => {
    try {
      const res = await api.get(`/products/${product.slug}`);
      const data = res.data.data.product;
      
      setFormData({
        name: data.name,
        description: data.description,
        brand: data.brand || '',
        categoryId: data.category_id,
        price: data.variants[0]?.price || '',
        stockQuantity: data.variants[0]?.stock_quantity || '',
        sku: data.variants[0]?.sku || '',
        imageUrl: data.images[0]?.image_url || ''
      });
      setEditingProductId(data.id);
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to fetch product details', err);
      alert('Failed to fetch product details');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${productId}`);
      setMyProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // The backend expects `variants` array and `images` array
      const payload = {
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        categoryId: formData.categoryId,
        isPublished: true, // Auto-publish for now
        variants: [
          {
            sku: formData.sku || `SKU-${Date.now()}`,
            price: parseFloat(formData.price),
            stockQuantity: parseInt(formData.stockQuantity),
            attributes: { "default": "standard" }
          }
        ],
        images: [
          {
            url: formData.imageUrl || `https://source.unsplash.com/random/800x800/?${encodeURIComponent(formData.name)}`,
            isPrimary: true,
            variantIndex: 0
          }
        ]
      };

      if (editingProductId) {
        await api.patch(`/products/${editingProductId}`, payload);
        setSubmitSuccess(true);
      } else {
        await api.post('/products', payload);
        setSubmitSuccess(true);
      }
      
      fetchMyProductsRefresh();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        brand: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        price: '',
        stockQuantity: '',
        sku: '',
        imageUrl: ''
      });
      
      // Hide form after 2 seconds
      setTimeout(() => {
        setShowForm(false);
        setEditingProductId(null);
        setSubmitSuccess(false);
      }, 2000);
      
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Seller Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your inventory and track your sales.</p>
          </div>
          <button 
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingProductId(null);
                setFormData({
                  name: '',
                  description: '',
                  brand: '',
                  categoryId: categories.length > 0 ? categories[0].id : '',
                  price: '',
                  stockQuantity: '',
                  sku: '',
                  imageUrl: ''
                });
              }
            }}
            className="bg-brand-DEFAULT text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-brand-dark transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add New Product'}
          </button>
        </header>

        {showForm ? (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{editingProductId ? 'Edit Product' : 'Create New Listing'}</h2>
            
            {submitSuccess && (
              <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium">
                ✅ Product published successfully!
              </div>
            )}
            
            {submitError && (
              <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-medium">
                ❌ {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-all outline-none"
                    placeholder="e.g., Wireless Noise-Cancelling Headphones"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-all outline-none"
                    placeholder="Describe your product in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <select
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-all outline-none bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-all outline-none"
                    placeholder="e.g., Sony"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-all outline-none"
                    placeholder="299.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    required
                    min="0"
                    step="1"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-all outline-none"
                    placeholder="50"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Image URL (Optional)</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-brand-light focus:border-brand-light transition-all outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If left blank, a random image will be generated based on the product name.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (editingProductId ? 'Saving...' : 'Publishing...') : (editingProductId ? 'Save Changes' : 'Publish Product')}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Sales</h3>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">$0.00</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Products</h3>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">{myProducts.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pending Orders</h3>
                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-2">0</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">My Products</h2>

            {isLoadingProducts ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading your products...</div>
            ) : myProducts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No products yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first product listing.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                  Create Product
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {myProducts.map((product) => (
                    <li key={product.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center">
                      <img 
                        src={product.primary_image || `https://source.unsplash.com/random/100x100/?${encodeURIComponent(product.name)}`}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                      />
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.category_name} &bull; {product.brand || 'No Brand'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-lg font-bold text-brand-dark dark:text-brand-light">${Number(product.starting_price).toFixed(2)}</p>
                        <p className={`text-sm mt-1 font-medium ${product.is_published ? 'text-green-600' : 'text-yellow-600'}`}>
                          {product.is_published ? 'Published' : 'Draft'}
                        </p>
                        <div className="mt-3 flex space-x-2">
                          <button onClick={() => handleEdit(product)} className="text-sm px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Edit</button>
                          <button onClick={() => handleDelete(product.id)} className="text-sm px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">Delete</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
