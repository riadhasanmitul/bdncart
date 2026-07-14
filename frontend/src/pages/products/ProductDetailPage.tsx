import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface Variant {
  id: string;
  sku: string;
  price: string;
  stock_quantity: number;
  attributes: Record<string, string>;
}

interface ProductImage {
  id: string;
  image_url: string;
}

interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  brand: string;
  category_name: string;
  variants: Variant[];
  images: ProductImage[];
}

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/products/${slug}`);
        const data = response.data.data.product;
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!selectedVariant) return;
    
    setIsAdding(true);
    try {
      await addToCart(selectedVariant.id, 1);
      // Optional: Show a success toast here
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-light"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-500 mb-4">{error || 'Product not found'}</p>
          <Link to="/" className="text-brand-DEFAULT hover:underline">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = (product.images && product.images.length > 0) ? product.images[0].image_url : `https://source.unsplash.com/random/800x800/?${encodeURIComponent(product.brand)},product`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Breadcrumbs */}
      <nav className="flex text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 space-x-2">
        <Link to="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <span className="hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer">{product.category_name}</span>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-300">{product.name}</span>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        {/* Product Image */}
        <div className="flex-shrink-0 mb-8 lg:mb-0">
          <div className="rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm aspect-w-1 aspect-h-1 w-full">
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            {product.name}
          </h1>
          <div className="text-lg text-brand-DEFAULT dark:text-brand-light font-semibold uppercase tracking-wide mb-6">
            {product.brand}
          </div>

          <p className="text-base text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {product.description}
          </p>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-auto">
            
            {/* Variants Selector */}
            {product.variants.length > 1 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-4">Select Option</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-brand-DEFAULT bg-brand-50 dark:bg-brand-900/40 text-brand-dark dark:text-brand-light'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Dynamically render variant attributes e.g. "Color: Red, Size: M" */}
                      {Object.values(variant.attributes).join(' - ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  ${selectedVariant ? parseFloat(selectedVariant.price).toFixed(2) : '---'}
                </div>
                {selectedVariant && (
                  <div className={`text-sm mt-1 font-medium ${selectedVariant.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedVariant.stock_quantity > 0 ? `${selectedVariant.stock_quantity} in stock` : 'Out of stock'}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock_quantity === 0 || isAdding}
              className="w-full bg-gray-900 dark:bg-brand-DEFAULT border border-transparent rounded-2xl shadow-sm py-4 px-8 text-base font-semibold text-white hover:bg-gray-800 dark:hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-brand-light transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 flex justify-center items-center"
            >
              {isAdding ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Add to cart'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
