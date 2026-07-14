import { useLocation, Link, Navigate } from 'react-router-dom';

const OrderSuccessPage = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;

  // If someone manually types /order-success without checking out, redirect them
  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      
      {/* Decorative blurred blobs for premium aesthetic */}
      <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-brand-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/80 dark:border-gray-700/80 relative z-10 text-center">
        
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
          <svg className="h-12 w-12 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Order Confirmed!
        </h2>
        
        <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
          Thank you for your purchase. We've received your order and will begin processing it shortly.
        </p>
        
        <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Order Number</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{orderId}</p>
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="w-full flex justify-center py-4 px-4 border border-transparent text-base font-semibold rounded-2xl text-white bg-gray-900 dark:bg-brand-DEFAULT hover:bg-gray-800 dark:hover:bg-brand-dark transition-colors shadow-sm hover:shadow-lg hover:-translate-y-0.5"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
