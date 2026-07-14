import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const CustomerDashboard = () => {
  const { user, logout, checkAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Profile State
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: '', streetAddress: '', city: '', state: '', postalCode: ''
  });
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);

  // Fetch Orders
  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        try {
          const response = await api.get('/orders');
          setOrders(response.data.data.orders);
        } catch (err) {
          console.error("Failed to fetch orders", err);
        } finally {
          setIsLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  // Sync Profile Form
  useEffect(() => {
    if (activeTab === 'profile' && user) {
      setProfileForm({ firstName: user.firstName, lastName: user.lastName });
      setProfileMessage('');
    }
  }, [activeTab, user]);

  // Fetch Addresses
  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const response = await api.get('/users/me/addresses');
      setAddresses(response.data.data.addresses);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    setProfileMessage('');
    try {
      await api.patch('/users/me', profileForm);
      await checkAuth(); // Refresh user context
      setProfileMessage('Profile updated successfully!');
    } catch (err) {
      setProfileMessage('Failed to update profile.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAddress(true);
    try {
      await api.post('/users/me/addresses', addressForm);
      await fetchAddresses();
      setAddressForm({ title: '', streetAddress: '', city: '', state: '', postalCode: '' });
      setIsAddingAddress(false);
    } catch (err) {
      alert('Failed to save address.');
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              My Account
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={logout}
              className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-brand-light flex items-center justify-center text-white text-xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>
              <nav className="flex flex-col p-2">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-dark dark:text-brand-light' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-dark dark:text-brand-light' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  Profile Settings
                </button>
                <button 
                  onClick={() => setActiveTab('addresses')}
                  className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'addresses' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-dark dark:text-brand-light' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  Addresses
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order History</h3>
                {isLoadingOrders ? (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't placed any orders yet.</p>
                    <Link to="/" className="inline-block px-6 py-2 bg-brand-DEFAULT text-white font-bold rounded-xl hover:bg-brand-dark transition-colors">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden sm:rounded-2xl border border-gray-100 dark:border-gray-700">
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      {orders.map((order) => (
                        <li key={order.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                Order #{order.id.split('-')[0].toUpperCase()}
                              </p>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Placed on {new Date(order.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="inline-flex px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 capitalize mb-1">
                                {order.status}
                              </p>
                              <p className="text-lg font-extrabold text-brand-dark dark:text-brand-light">
                                ${Number(order.total_amount).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="animate-fade-in-up bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Settings</h3>
                {profileMessage && (
                  <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${profileMessage.includes('success') ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'}`}>
                    {profileMessage}
                  </div>
                )}
                <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input type="email" value={user?.email || ''} disabled className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                      <input 
                        type="text" 
                        required 
                        value={profileForm.firstName} 
                        onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                      <input 
                        type="text" 
                        required 
                        value={profileForm.lastName} 
                        onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-light focus:border-brand-light outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmittingProfile} className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    {isSubmittingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Shipping Addresses</h3>
                  {!isAddingAddress && (
                    <button onClick={() => setIsAddingAddress(true)} className="px-4 py-2 bg-brand-DEFAULT text-white text-sm font-bold rounded-xl hover:bg-brand-dark transition-colors">
                      + Add Address
                    </button>
                  )}
                </div>

                {isAddingAddress ? (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">Add New Address</h4>
                    <form onSubmit={handleAddressSubmit} className="space-y-4 max-w-lg">
                      <input type="text" placeholder="Title (e.g. Home, Office)" required value={addressForm.title} onChange={e => setAddressForm({...addressForm, title: e.target.value})} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-light outline-none" />
                      <input type="text" placeholder="Street Address" required value={addressForm.streetAddress} onChange={e => setAddressForm({...addressForm, streetAddress: e.target.value})} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-light outline-none" />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="City" required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-light outline-none" />
                        <input type="text" placeholder="State" required value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-light outline-none" />
                      </div>
                      <input type="text" placeholder="Postal Code" required value={addressForm.postalCode} onChange={e => setAddressForm({...addressForm, postalCode: e.target.value})} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-brand-light outline-none" />
                      <div className="flex space-x-3 pt-4">
                        <button type="submit" disabled={isSubmittingAddress} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl disabled:opacity-50">Save</button>
                        <button type="button" onClick={() => setIsAddingAddress(false)} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {isLoadingAddresses ? (
                  <div className="text-gray-500 dark:text-gray-400">Loading...</div>
                ) : addresses.length === 0 && !isAddingAddress ? (
                  <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                    No addresses saved yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div key={addr.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-brand-light dark:hover:border-brand-light transition-colors relative group">
                        <h4 className="font-bold text-gray-900 dark:text-white">{addr.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{addr.street_address}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{addr.city}, {addr.state} {addr.postal_code}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
