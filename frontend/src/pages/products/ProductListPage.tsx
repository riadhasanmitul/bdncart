import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  starting_price: string;
  primary_image?: string;
}

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Extract filters from URL
  const searchQuery = searchParams.get('search') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: '12',
          ...(searchQuery && { search: searchQuery }),
          ...(maxPrice && { maxPrice }),
          ...(sort && { sort })
        }).toString();

        const response = await api.get(`/products?${query}`);
        setProducts(response.data.data.products);
        setTotal(response.data.total);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, maxPrice, sort, page]);

  const updateParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filters</h3>
            
            <div className="space-y-4">
              {/* Max Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Price: ${maxPrice || 'Any'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={maxPrice || 2000}
                  onChange={(e) => updateParams('maxPrice', e.target.value === '2000' ? '' : e.target.value)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-DEFAULT"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>$0</span>
                  <span>$2000+</span>
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => updateParams('sort', e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-brand-light focus:border-brand-light sm:text-sm rounded-xl bg-white dark:bg-gray-800 dark:text-white border"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Search results for "{searchQuery}"
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{total} products found</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-light"></div>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search or filters.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-brand-DEFAULT hover:bg-brand-dark"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
