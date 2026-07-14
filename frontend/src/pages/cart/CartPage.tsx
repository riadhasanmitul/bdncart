import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, isLoadingCart } = useCart();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: ''
  });
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  // Fetch addresses when component mounts
  const fetchAddresses = async () => {
    try {
      const response = await api.get('/users/me/addresses');
      const userAddresses = response.data.data.addresses;
      setAddresses(userAddresses);
      if (userAddresses.length > 0) {
        setSelectedAddressId(userAddresses[0].id);
        setIsAddingAddress(false);
      } else {
        setIsAddingAddress(true);
      }
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAddress(true);
    try {
      await api.post('/users/me/addresses', addressForm);
      await fetchAddresses();
      // Reset form
      setAddressForm({
        title: '',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: ''
      });
    } catch (err) {
      console.error('Failed to add address', err);
      alert('Failed to save address. Please check your inputs.');
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    
    if (!selectedAddressId && !isAddingAddress) {
      setCheckoutError('Please select a shipping address');
      return;
    }
    
    if (isAddingAddress) {
      setCheckoutError('Please save your shipping address first');
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError('');
    
    try {
      const response = await api.post('/orders/checkout', {
        shippingAddressId: selectedAddressId,
      });
      
      clearCart();
      navigate('/order-success', { state: { orderId: response.data.data.orderId } });
    } catch (err: any) {
      setCheckoutError(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoadingCart || isLoadingAddresses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-light"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="mx-auto h-24 w-24 text-gray-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">Looks like you haven't added anything yet.</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-brand-DEFAULT hover:bg-brand-dark transition-colors"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-8">Shopping Cart</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        
        {/* Cart Items */}
        <div className="lg:col-span-7">
          <ul className="border-t border-b border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {cart.items.map((item) => (
              <li key={item.variantId} className="flex py-6 sm:py-10">
                <div className="flex-shrink-0">
                  <img
                    src={`https://source.unsplash.com/random/200x200/?product,${item.variantId}`}
                    alt={item.productName}
                    className="w-24 h-24 rounded-lg object-center object-cover sm:w-32 sm:h-32 border border-gray-100 shadow-sm"
                  />
                </div>

                <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                  <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {item.productName}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Variant ID: {item.variantId}</p>
                      <p className="mt-1 text-lg font-medium text-brand-dark dark:text-brand-light">
                        ${Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                      <label htmlFor={`quantity-${item.variantId}`} className="sr-only">
                        Quantity, {item.productName}
                      </label>
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg w-max bg-white dark:bg-gray-800">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-medium text-gray-900 dark:text-white border-l border-r border-gray-300 dark:border-gray-600">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="absolute top-0 right-0 sm:relative sm:top-auto sm:right-auto sm:mt-4">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.variantId)}
                          className="-m-2 p-2 inline-flex text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <span className="sr-only">Remove</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Order Summary */}
        <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-2xl px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Order summary</h2>
          
          {/* Shipping Address Selection */}
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Shipping Address</h3>
              {addresses.length > 0 && !isAddingAddress && (
                <button 
                  onClick={() => setIsAddingAddress(true)}
                  className="text-xs font-medium text-brand-DEFAULT hover:text-brand-dark"
                >
                  + Add New
                </button>
              )}
            </div>
            
            {isAddingAddress ? (
              <form onSubmit={handleAddressSubmit} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                <input
                  type="text"
                  placeholder="Address Title (e.g., Home)"
                  required
                  value={addressForm.title}
                  onChange={e => setAddressForm(prev => ({...prev, title: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-light focus:border-brand-light"
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  required
                  value={addressForm.streetAddress}
                  onChange={e => setAddressForm(prev => ({...prev, streetAddress: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-light focus:border-brand-light"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={addressForm.city}
                    onChange={e => setAddressForm(prev => ({...prev, city: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-light focus:border-brand-light"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={addressForm.state}
                    onChange={e => setAddressForm(prev => ({...prev, state: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-light focus:border-brand-light"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Postal Code"
                  required
                  value={addressForm.postalCode}
                  onChange={e => setAddressForm(prev => ({...prev, postalCode: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-light focus:border-brand-light"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  {addresses.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => setIsAddingAddress(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={isSubmittingAddress}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-md disabled:opacity-50"
                  >
                    {isSubmittingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            ) : addresses.length > 0 ? (
              <select
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-light focus:border-brand-light sm:text-sm rounded-md"
              >
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.title} - {addr.street_address}, {addr.city}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600 dark:text-gray-400">Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)</dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">${cart.totalPrice.toFixed(2)}</dd>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <dt className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span>Shipping estimate</span>
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">Free</dd>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <dt className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span>Tax estimate</span>
              </dt>
              <dd className="text-sm font-medium text-gray-900 dark:text-white">${(cart.totalPrice * 0.08).toFixed(2)}</dd>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <dt className="text-base font-extrabold text-gray-900 dark:text-white">Order total</dt>
              <dd className="text-xl font-extrabold text-brand-dark dark:text-brand-light">${(cart.totalPrice * 1.08).toFixed(2)}</dd>
            </div>
          </dl>

          {checkoutError && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
              {checkoutError}
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || addresses.length === 0}
              className="w-full bg-gray-900 border border-transparent rounded-2xl shadow-sm py-4 px-4 text-base font-semibold text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 transition-colors flex justify-center items-center hover:shadow-lg hover:-translate-y-0.5"
            >
              {isCheckingOut ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Checkout...
                </span>
              ) : (
                'Checkout'
              )}
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              or{' '}
              <Link to="/" className="text-brand-DEFAULT font-medium hover:text-brand-dark transition-colors">
                Continue Shopping<span aria-hidden="true"> &rarr;</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
