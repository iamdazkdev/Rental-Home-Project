import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLoaderData, useFetcher, useSubmit, useNavigation } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import PaymentHistory from '../../components/payment/PaymentHistory';
import API_BASE_URL from '../../config/api';
import '../../styles/AdminManagement.scss';
import { toast, confirmDialog } from "../../stores/useNotificationStore";
import { store } from "../../redux/store";

const API_ENDPOINTS = {
    categories: `/user-categories`,
    types: `/user-property-types`,
    facilities: `/user-facilities`,
};

export const adminManagementLoader = async ({ request }) => {
    const url = new URL(request.url);
    const activeTab = url.searchParams.get("tab") || "categories";
    const user = store.getState().user.profile;
    const userId = user?._id;

    if (!userId) {
        return { items: [], paymentHistory: [], activeTab };
    }

    try {
        if (activeTab === "payments") {
            const response = await fetch(`${API_BASE_URL}/payment-history/host/${userId}`);
            const data = await response.json();
            return { items: [], paymentHistory: data, activeTab };
        } else {
            const endpoint = `${API_ENDPOINTS[activeTab]}/user/${userId}`;
            const response = await fetch(`${API_BASE_URL}${endpoint}?activeOnly=false`);
            const data = await response.json();
            return { items: data, paymentHistory: [], activeTab };
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        return { items: [], paymentHistory: [], activeTab };
    }
};

export const adminManagementAction = async ({ request }) => {
    const formData = await request.formData();
    const action = formData.get("action");
    const activeTab = formData.get("activeTab");
    const userId = store.getState().user.profile?._id;
    
    if (!userId) return null;

    const endpoint = `${API_ENDPOINTS[activeTab]}/user/${userId}`;

    try {
        if (action === "initialize") {
            const response = await fetch(`${API_BASE_URL}${endpoint}/initialize`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) toast.info(data.message);
            else toast.error(data.message || 'Failed to initialize');
        } 
        else if (action === "hide" || action === "show" || action === "delete") {
            const itemId = formData.get("itemId");
            let fetchUrl, method;
            
            if (action === "hide") {
                fetchUrl = `${API_BASE_URL}${endpoint}/${itemId}`;
                method = 'DELETE';
            } else if (action === "show") {
                fetchUrl = `${API_BASE_URL}${endpoint}/${itemId}/reactivate`;
                method = 'PATCH';
            } else if (action === "delete") {
                fetchUrl = `${API_BASE_URL}${endpoint}/${itemId}?permanent=true`;
                method = 'DELETE';
            }
            
            const response = await fetch(fetchUrl, { method });
            const data = await response.json();
            if (response.ok) toast.info(data.message);
            else toast.error(data.message || 'Action failed');
        }
        else if (action === "save") {
            const itemId = formData.get("itemId");
            const isEditing = itemId && itemId !== "null";
            const url = isEditing
                ? `${API_BASE_URL}${endpoint}/${itemId}`
                : `${API_BASE_URL}${endpoint}`;
            const method = isEditing ? 'PATCH' : 'POST';
            
            const payload = {
                label: formData.get("label"),
                name: formData.get("name"),
                description: formData.get("description"),
                icon: formData.get("icon"),
                img: formData.get("img"),
                category: formData.get("category"),
                displayOrder: parseInt(formData.get("displayOrder") || "0", 10),
            };

            const response = await fetch(url, {
                method,
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (response.ok) toast.info(data.message);
            else toast.error(data.message || 'Failed to save');
            return { success: response.ok };
        }
    } catch (error) {
        toast.error("Action failed");
        return { success: false };
    }
    return { success: true };
};

const AdminManagement = () => {
    const { items, paymentHistory, activeTab } = useLoaderData();
    const user = useSelector((state) => state.user.profile);
    const submit = useSubmit();
    const fetcher = useFetcher();
    const navigation = useNavigation();

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        label: '',
        name: '',
        description: '',
        icon: '',
        img: '',
        category: 'other',
        displayOrder: 0,
    });

    // Reset modal on success save
    React.useEffect(() => {
        if (fetcher.state === "idle" && fetcher.data?.success && showAddModal && fetcher.formData?.get("action") === "save") {
            setShowAddModal(false);
            setEditingItem(null);
            resetForm();
        }
    }, [fetcher.state, fetcher.data, showAddModal, fetcher.formData]);

    const handleTabChange = (tab) => {
        submit(`?tab=${tab}`);
    };

    const handleInitialize = async () => {
        if (!await confirmDialog({ message: 'Initialize from global templates? This will add all default items to your collection.' })) return;
        fetcher.submit({ action: "initialize", activeTab }, { method: "post" });
    };

    const handleHide = async (itemId) => {
        if (!await confirmDialog({ message: 'Hide this item? You can show it again later.' })) return;
        fetcher.submit({ action: "hide", itemId, activeTab }, { method: "post" });
    };

    const handleShow = async (itemId) => {
        fetcher.submit({ action: "show", itemId, activeTab }, { method: "post" });
    };

    const handleDelete = async (itemId) => {
        if (!await confirmDialog({ message: '⚠️ DELETE PERMANENTLY? This cannot be undone!' })) return;
        fetcher.submit({ action: "delete", itemId, activeTab }, { method: "post" });
    };

    const handleSave = () => {
        fetcher.submit(
            { 
                action: "save", 
                activeTab, 
                itemId: editingItem?._id || "null",
                ...formData
            }, 
            { method: "post" }
        );
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            label: item.label || '',
            name: item.name || '',
            description: item.description || '',
            icon: item.icon || '',
            img: item.img || '',
            category: item.category || 'other',
            displayOrder: parseInt(item.displayOrder || 0, 10),
        });
        setShowAddModal(true);
    };

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

    const handleAdd = () => {
        resetForm();
        setEditingItem(null);
        setShowAddModal(true);
    };

    if (!user) {
        return (
            <div className="admin-management">
                <h1>Please login to access this page</h1>
            </div>
        );
    }

    const isLoading = navigation.state === "loading" || fetcher.state !== "idle";
    const activeItems = items.filter(item => item.isActive);
    const hiddenItems = items.filter(item => !item.isActive);

    return (
        <>
            <Navbar/>
            <div className="admin-management">
                <div className="admin-header">
                    <h1>📊 Manage Your Data</h1>
                    <p>Customize categories, property types, and facilities for your listings</p>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={activeTab === 'categories' ? 'active' : ''}
                        onClick={() => handleTabChange('categories')}
                    >
                        🏷️ Categories
                    </button>
                    <button
                        className={activeTab === 'types' ? 'active' : ''}
                        onClick={() => handleTabChange('types')}
                    >
                        🏠 Property Types
                    </button>
                    <button
                        className={activeTab === 'facilities' ? 'active' : ''}
                        onClick={() => handleTabChange('facilities')}
                    >
                        ⚙️ Facilities
                    </button>
                    <button
                        className={activeTab === 'payments' ? 'active' : ''}
                        onClick={() => handleTabChange('payments')}
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
                        <button className="btn-refresh" onClick={() => handleTabChange(activeTab)}>
                            🔃 Refresh
                        </button>
                    </div>
                )}

                {/* Loading */}
                {isLoading && <div className="loading">Loading...</div>}

                {/* Payment History Tab */}
                {activeTab === 'payments' && (
                    <div className="payment-history-section">
                        <div className="actions">
                            <button className="btn-refresh" onClick={() => handleTabChange('payments')}>
                                🔃 Refresh
                            </button>
                        </div>
                        {paymentHistory.length > 0 ? (
                            <PaymentHistory paymentHistory={paymentHistory}/>
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
                                        <button onClick={() => handleEdit(item)} disabled={isLoading}>✏️ Edit</button>
                                        <button onClick={() => handleHide(item._id)} disabled={isLoading}>🙈 Hide</button>
                                        {item.isCustom && (
                                            <button className="btn-danger" onClick={() => handleDelete(item._id)} disabled={isLoading}>
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
                                        <button onClick={() => handleShow(item._id)} disabled={isLoading}>👁️ Show</button>
                                        <button className="btn-danger" onClick={() => handleDelete(item._id)} disabled={isLoading}>
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
                                        const value = parseInt(e.target.value, 10);
                                        setFormData({...formData, displayOrder: isNaN(value) ? 0 : value});
                                    }}
                                />
                            </div>

                            <div className="modal-actions">
                                <button className="btn-save" onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? 'Saving...' : '💾 Save'}
                                </button>
                                <button className="btn-cancel" onClick={() => {
                                    setShowAddModal(false);
                                    setEditingItem(null);
                                    resetForm();
                                }} disabled={isLoading}>
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
