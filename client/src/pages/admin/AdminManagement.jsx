import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/Navbar';
import PaymentHistory from '../../components/PaymentHistory';
import '../../styles/AdminManagement.scss';

const AdminManagement = () => {
  const user = useSelector((state) => state.user);
  const userId = user?._id;

  const [activeTab, setActiveTab] = useState('categories'); // categories, types, facilities, payments
  const [items, setItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    label: '', // for categories
    name: '', // for types & facilities
    description: '',
    icon: '',
    img: '',
    category: 'other', // for facilities
    displayOrder: 0,
  });

  // Helper function to safely parse number
  const safeParseInt = (value, defaultValue = 0) => {
    if (value === '' || value === null || value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // API endpoints map
  const API_ENDPOINTS = useMemo(() => ({
    categories: `/user-categories/user/${userId}`,
    types: `/user-property-types/user/${userId}`,
    facilities: `/user-facilities/user/${userId}`,
  }), [userId]);

  // Fetch items based on active tab
  const fetchItems = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const endpoint = API_ENDPOINTS[activeTab];
      const response = await fetch(`http://localhost:3001${endpoint}?activeOnly=false`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab, API_ENDPOINTS]);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch as host
      const response = await fetch(`http://localhost:3001/payment-history/host/${userId}`);
      const data = await response.json();
      setPaymentHistory(data);
      console.log('✅ Payment history loaded:', data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      alert('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initialize user data (fork from global templates)
  const handleInitialize = async () => {
    if (!window.confirm('Initialize from global templates? This will add all default items to your collection.')) {
      return;
    }

    try {
      const endpoint = API_ENDPOINTS[activeTab];
      const response = await fetch(`http://localhost:3001${endpoint}/initialize`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchItems();
      } else {
        alert(data.message || 'Failed to initialize');
      }
    } catch (error) {
      console.error('Error initializing:', error);
      alert('Failed to initialize');
    }
  };

  // Create or Update item
  const handleSave = async () => {
    if (!userId) return;

    const endpoint = API_ENDPOINTS[activeTab];
    const isEditing = !!editingItem;
    const url = isEditing
      ? `http://localhost:3001${endpoint}/${editingItem._id}`
      : `http://localhost:3001${endpoint}`;

    const method = isEditing ? 'PATCH' : 'POST';

    // Prepare data and ensure no NaN values
    const dataToSend = {
      ...formData,
      displayOrder: isNaN(formData.displayOrder) ? 0 : formData.displayOrder,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setShowAddModal(false);
        setEditingItem(null);
        resetForm();
        fetchItems();
      } else {
        alert(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save item');
    }
  };

  // Hide item (soft delete)
  const handleHide = async (itemId) => {
    if (!window.confirm('Hide this item? You can show it again later.')) return;

    const endpoint = API_ENDPOINTS[activeTab];
    try {
      const response = await fetch(`http://localhost:3001${endpoint}/${itemId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchItems();
      } else {
        alert(data.message || 'Failed to hide');
      }
    } catch (error) {
      console.error('Error hiding:', error);
      alert('Failed to hide item');
    }
  };

  // Show item (reactivate)
  const handleShow = async (itemId) => {
    const endpoint = API_ENDPOINTS[activeTab];
    try {
      const response = await fetch(`http://localhost:3001${endpoint}/${itemId}/reactivate`, {
        method: 'PATCH',
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchItems();
      } else {
        alert(data.message || 'Failed to show');
      }
    } catch (error) {
      console.error('Error showing:', error);
      alert('Failed to show item');
    }
  };

  // Delete permanently
  const handleDelete = async (itemId) => {
    if (!window.confirm('⚠️ DELETE PERMANENTLY? This cannot be undone!')) return;

    const endpoint = API_ENDPOINTS[activeTab];
    try {
      const response = await fetch(`http://localhost:3001${endpoint}/${itemId}?permanent=true`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchItems();
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete item');
    }
  };

  // Open edit modal
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      label: item.label || '',
      name: item.name || '',
      description: item.description || '',
      icon: item.icon || '',
      img: item.img || '',
      category: item.category || 'other',
      displayOrder: safeParseInt(item.displayOrder, 0),
    });
    setShowAddModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      label: '',
      name: '',
      description: '',
      icon: '',
      img: '',
      category: 'other',
      displayOrder: 0,
    });
  };

  // Open add modal
  const handleAdd = () => {
    resetForm();
    setEditingItem(null);
    setShowAddModal(true);
  };

  useEffect(() => {
    if (userId) {
      if (activeTab === 'payments') {
        fetchPaymentHistory();
      } else {
        fetchItems();
      }
    }
  }, [activeTab, userId, fetchItems, fetchPaymentHistory]);

  if (!user) {
    return (
      <div className="admin-management">
        <h1>Please login to access this page</h1>
      </div>
    );
  }

  const activeItems = items.filter(item => item.isActive);
  const hiddenItems = items.filter(item => !item.isActive);

  return (
    <>
      <Navbar />
      <div className="admin-management">
        <div className="admin-header">
          <h1>📊 Manage Your Data</h1>
          <p>Customize categories, property types, and facilities for your listings</p>
        </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'categories' ? 'active' : ''}
          onClick={() => setActiveTab('categories')}
        >
          🏷️ Categories
        </button>
        <button
          className={activeTab === 'types' ? 'active' : ''}
          onClick={() => setActiveTab('types')}
        >
          🏠 Property Types
        </button>
        <button
          className={activeTab === 'facilities' ? 'active' : ''}
          onClick={() => setActiveTab('facilities')}
        >
          ⚙️ Facilities
        </button>
        <button
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          💰 Payment History
        </button>
      </div>

      {/* Actions */}
      {activeTab !== 'payments' && (
        <div className="actions">
          <button className="btn-add" onClick={handleAdd}>
            ➕ Add Custom
          </button>
          {items.length === 0 && (
            <button className="btn-initialize" onClick={handleInitialize}>
              🔄 Initialize from Templates
            </button>
          )}
          <button className="btn-refresh" onClick={activeTab === 'payments' ? fetchPaymentHistory : fetchItems}>
            🔃 Refresh
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="loading">Loading...</div>}

      {/* Payment History Tab */}
      {activeTab === 'payments' && (
        <div className="payment-history-section">
          <div className="actions">
            <button className="btn-refresh" onClick={fetchPaymentHistory}>
              🔃 Refresh
            </button>
          </div>
          {paymentHistory.length > 0 ? (
            <PaymentHistory paymentHistory={paymentHistory} />
          ) : (
            <div className="empty-state">
              <p>No payment history found</p>
            </div>
          )}
        </div>
      )}

      {/* Active Items */}
      {activeTab !== 'payments' && (
        <div className="items-section">
          <h2>Active ({activeItems.length})</h2>
          <div className="items-grid">
            {activeItems.map(item => (
              <div key={item._id} className="item-card active">
                <div className="item-header">
                  <span className="item-icon">{item.icon}</span>
                  <h3>{item.label || item.name}</h3>
                  {item.isCustom && <span className="badge-custom">Custom</span>}
                </div>
                <p className="item-description">{item.description}</p>
                {item.category && (
                  <span className="item-category">{item.category}</span>
                )}
                <div className="item-actions">
                  <button onClick={() => handleEdit(item)}>✏️ Edit</button>
                  <button onClick={() => handleHide(item._id)}>🙈 Hide</button>
                  {item.isCustom && (
                    <button className="btn-danger" onClick={() => handleDelete(item._id)}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Items */}
      {activeTab !== 'payments' && hiddenItems.length > 0 && (
        <div className="items-section">
          <h2>Hidden ({hiddenItems.length})</h2>
          <div className="items-grid">
            {hiddenItems.map(item => (
              <div key={item._id} className="item-card hidden">
                <div className="item-header">
                  <span className="item-icon">{item.icon}</span>
                  <h3>{item.label || item.name}</h3>
                  {item.isCustom && <span className="badge-custom">Custom</span>}
                </div>
                <p className="item-description">{item.description}</p>
                <div className="item-actions">
                  <button onClick={() => handleShow(item._id)}>👁️ Show</button>
                  <button className="btn-danger" onClick={() => handleDelete(item._id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingItem ? '✏️ Edit' : '➕ Add'} {activeTab === 'categories' ? 'Category' : activeTab === 'types' ? 'Property Type' : 'Facility'}</h2>

            <div className="form-group">
              <label>{activeTab === 'categories' ? 'Label' : 'Name'}:</label>
              <input
                type="text"
                value={activeTab === 'categories' ? formData.label : formData.name}
                onChange={e => setFormData({
                  ...formData,
                  [activeTab === 'categories' ? 'label' : 'name']: e.target.value
                })}
                placeholder="e.g., Pet Paradise"
              />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe this item..."
              />
            </div>

            <div className="form-group">
              <label>Icon:</label>
              <input
                type="text"
                value={formData.icon}
                onChange={e => setFormData({...formData, icon: e.target.value})}
                placeholder="e.g., pets, home, wifi"
              />
            </div>

            {activeTab === 'categories' && (
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="text"
                  value={formData.img}
                  onChange={e => setFormData({...formData, img: e.target.value})}
                  placeholder="assets/image.jpg"
                />
              </div>
            )}

            {activeTab === 'facilities' && (
              <div className="form-group">
                <label>Category:</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="basic">Basic</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="safety">Safety</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Display Order:</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={e => {
                  const value = safeParseInt(e.target.value, 0);
                  setFormData({...formData, displayOrder: value});
                }}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={handleSave}>
                💾 Save
              </button>
              <button className="btn-cancel" onClick={() => {
                setShowAddModal(false);
                setEditingItem(null);
                resetForm();
              }}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default AdminManagement;

