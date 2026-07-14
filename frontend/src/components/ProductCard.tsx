import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    starting_price: string;
    primary_image?: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  // We use the uploaded primary image, or fallback to Unsplash
  const imageUrl = product.primary_image || `https://source.unsplash.com/random/400x400/?${encodeURIComponent(product.brand)},product`;

  return (
    <Link to={`/product/${product.slug}`} className="group block h-full">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 h-full flex flex-col">
        {/* Image Container */}
        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content Container */}
        <div className="p-5 flex flex-col flex-grow">
          <div className="text-xs font-semibold text-brand-DEFAULT uppercase tracking-wider mb-1">
            {product.brand}
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2">
            {product.name}
          </h3>
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="text-lg font-extrabold text-gray-900 dark:text-white">
              ${parseFloat(product.starting_price).toFixed(2)}
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-dark dark:group-hover:text-brand-light transition-colors">
              View details
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
