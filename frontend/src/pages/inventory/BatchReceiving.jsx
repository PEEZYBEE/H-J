import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Plus, Package, Check, Search, Trash2 } from 'lucide-react';
import { getSuppliers, createBatch, addBatchItem, deleteBatchItem, submitBatch, getAllProducts } from '../../services/api';

const BatchReceiving = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [batchItems, setBatchItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // Form state
  const [batchForm, setBatchForm] = useState({
    supplier_id: '',
    invoice_number: '',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_notes: ''
  });

  // Item form state - EDITABLE FIELDS
  const [itemForm, setItemForm] = useState({
    product_id: '',
    expected_quantity: '',
    received_quantity: '',
    unit_price: '',
    condition: 'good',
    batch_number: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await getAllProducts({ limit: 100 });
      console.log('Products response:', response);
      
      // Handle response format
      let productsData = [];
      if (response.products && Array.isArray(response.products)) {
        productsData = response.products;
      } else if (Array.isArray(response)) {
        productsData = response;
      } else if (response.data && Array.isArray(response.data)) {
        productsData = response.data;
      }
      
      console.log(`Loaded ${productsData.length} products`);
      setProducts(productsData);
      
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Create test products for development
      const testProducts = [
        { id: 1, sku: 'WB-500-ST', name: 'Stainless Steel Water Bottle 500ml', price: 850, stock_quantity: 100 },
        { id: 2, sku: 'WB-750-PL', name: 'Plastic Sports Water Bottle 750ml', price: 350, stock_quantity: 200 },
        { id: 3, sku: 'KU-SP-WD', name: 'Wooden Cooking Spoon Set', price: 450, stock_quantity: 150 },
        { id: 4, sku: 'KU-LA-ST', name: 'Stainless Steel Ladle', price: 280, stock_quantity: 120 },
        { id: 5, sku: 'FL-1L-TH', name: 'Thermal Flask 1 Liter', price: 1200, stock_quantity: 80 },
        { id: 6, sku: 'MG-CE-11', name: 'Ceramic Coffee Mug 350ml', price: 250, stock_quantity: 300 }
      ];
      setProducts(testProducts);
      console.log('Using test products:', testProducts.length);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers();
      console.log('Suppliers:', response);
      
      let suppliersData = [];
      if (Array.isArray(response)) {
        suppliersData = response;
      } else if (response.data && Array.isArray(response.data)) {
        suppliersData = response.data;
      } else if (response.suppliers && Array.isArray(response.suppliers)) {
        suppliersData = response.suppliers;
      }
      
      setSuppliers(suppliersData);
      console.log(`Loaded ${suppliersData.length} suppliers`);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const validateBatchForm = () => {
    const newErrors = {};
    
    if (!batchForm.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }
    
    if (!batchForm.invoice_number?.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createNewBatch = async () => {
    if (!validateBatchForm()) return;
    
    try {
      setLoading(true);
      const batchData = {
        supplier_id: parseInt(batchForm.supplier_id),
        invoice_number: batchForm.invoice_number.trim(),
        delivery_date: batchForm.delivery_date || undefined,
        delivery_notes: batchForm.delivery_notes || undefined
      };
      
      console.log('Creating batch:', batchData);
      const response = await createBatch(batchData);
      console.log('Batch created:', response);
      
      if (response.success || response.batch || response.data) {
        const batch = response.batch || response.data || response;
        setCurrentBatch(batch);
        setBatchItems([]);
        alert('New batch created! You can now add items.');
      }
    } catch (error) {
      console.error('Failed to create batch:', error);
      alert(error.message || 'Failed to create batch');
    } finally {
      setLoading(false);
    }
  };

  const validateItemForm = () => {
    const newErrors = {};
    
    if (!itemForm.product_id) {
      newErrors.product_id = 'Product is required';
    }
    
    const receivedQty = parseInt(itemForm.received_quantity);
    if (!receivedQty || receivedQty <= 0) {
      newErrors.received_quantity = 'Received quantity must be greater than 0';
    }
    
    const unitPrice = parseFloat(itemForm.unit_price);
    if (isNaN(unitPrice) || unitPrice < 0) {
      newErrors.unit_price = 'Valid unit price is required';
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const addItemToBatch = async () => {
    if (!currentBatch) {
      alert('Please create a batch first');
      return;
    }
    
    if (!validateItemForm()) return;

    try {
      setLoading(true);
      const itemData = {
        product_id: parseInt(itemForm.product_id),
        expected_quantity: parseInt(itemForm.expected_quantity) || 0,
        received_quantity: parseInt(itemForm.received_quantity),
        unit_price: parseFloat(itemForm.unit_price),
        condition: itemForm.condition,
        batch_number: itemForm.batch_number || undefined
      };
      
      console.log('Adding item:', itemData);
      const response = await addBatchItem(currentBatch.id || currentBatch._id, itemData);
      console.log('Item added:', response);
      
      if (response.success || response.item || response.data) {
        const newItem = response.item || response.data || response;
        setBatchItems(prev => [...prev, newItem]);
        
        // Reset form
        setItemForm({
          product_id: '',
          expected_quantity: '',
          received_quantity: '',
          unit_price: '',
          condition: 'good',
          batch_number: ''
        });
        setSearchTerm('');
        setErrors({});
        alert('Item added successfully!');
      }
    } catch (error) {
      console.error('Failed to add item:', error);
      alert(error.message || 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (index) => {
    const item = batchItems[index];
    if (!item.id) {
      setBatchItems(prev => prev.filter((_, i) => i !== index));
      return;
    }
    
    if (window.confirm('Remove this item from the batch?')) {
      try {
        const response = await deleteBatchItem(currentBatch.id, item.id);
        if (response.success) {
          setBatchItems(prev => prev.filter((_, i) => i !== index));
          alert('Item removed successfully!');
        }
      } catch (error) {
        console.error('Failed to remove item:', error);
        alert('Failed to remove item');
      }
    }
  };

  const submitBatchForReview = async () => {
    if (!currentBatch || batchItems.length === 0) {
      alert('Please create a batch and add items first');
      return;
    }

    if (!window.confirm('Submit this batch for review?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await submitBatch(currentBatch.id || currentBatch._id);
      
      if (response.success) {
        alert('Batch submitted for review!');
        navigate('/inventory/approval');
      }
    } catch (error) {
      console.error('Failed to submit batch:', error);
      alert(error.message || 'Failed to submit batch');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = searchTerm
    ? products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const totalValue = batchItems.reduce((sum, item) => {
    const price = parseFloat(item.unit_price) || 0;
    const quantity = item.received_quantity || 0;
    return sum + (price * quantity);
  }, 0);

  const getProductName = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product ? `${product.name} (${product.sku})` : 'Unknown Product';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Batch Receiving</h1>
          <p className="text-gray-600">Receive new stock and submit for approval</p>
        </div>

        {!currentBatch ? (
          <div className="bg-white rounded-xl shadow p-4 md:p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5" />
              Create New Receiving Batch
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  value={batchForm.supplier_id}
                  onChange={(e) => {
                    setBatchForm({...batchForm, supplier_id: e.target.value});
                    setErrors({...errors, supplier_id: ''});
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.supplier_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.supplier_id}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={batchForm.invoice_number}
                  onChange={(e) => {
                    setBatchForm({...batchForm, invoice_number: e.target.value});
                    setErrors({...errors, invoice_number: ''});
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.invoice_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="INV-2024-001"
                  required
                />
                {errors.invoice_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.invoice_number}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={batchForm.delivery_date}
                  onChange={(e) => setBatchForm({...batchForm, delivery_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Notes
                </label>
                <input
                  type="text"
                  value={batchForm.delivery_notes}
                  onChange={(e) => setBatchForm({...batchForm, delivery_notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            
            <button
              onClick={createNewBatch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create New Batch'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Batch: {currentBatch.batch_number || `#${currentBatch.id}`}
                  </h2>
                  <p className="text-gray-600">
                    Status: <span className="font-bold text-yellow-600">Draft</span>
                  </p>
                  {suppliers.find(s => s.id === currentBatch.supplier_id) && (
                    <p className="text-sm text-gray-500">
                      Supplier: {suppliers.find(s => s.id === currentBatch.supplier_id).name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col md:items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Items: {batchItems.length}</p>
                    <p className="text-lg font-bold text-green-600">
                      KSh {totalValue.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={submitBatchForReview}
                    disabled={loading || batchItems.length === 0}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Add Items to Batch
              </h3>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search products by name or SKU..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={itemForm.product_id}
                    onChange={(e) => {
                      const productId = e.target.value;
                      const product = products.find(p => p.id === parseInt(productId));
                      setItemForm({
                        ...itemForm,
                        product_id: productId,
                        unit_price: product?.price || ''
                      });
                      setErrors({...errors, product_id: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.product_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select Product</option>
                    {filteredProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - Stock: {product.stock_quantity || 0}
                      </option>
                    ))}
                  </select>
                  {errors.product_id && (
                    <p className="text-red-500 text-sm mt-1">{errors.product_id}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Qty
                  </label>
                  <input
                    type="number"
                    value={itemForm.expected_quantity}
                    onChange={(e) => setItemForm({...itemForm, expected_quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Received Qty *
                  </label>
                  <input
                    type="number"
                    value={itemForm.received_quantity}
                    onChange={(e) => {
                      setItemForm({...itemForm, received_quantity: e.target.value});
                      setErrors({...errors, received_quantity: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.received_quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    required
                    placeholder="1"
                  />
                  {errors.received_quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.received_quantity}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (KSh) *
                  </label>
                  <input
                    type="number"
                    value={itemForm.unit_price}
                    onChange={(e) => {
                      setItemForm({...itemForm, unit_price: e.target.value});
                      setErrors({...errors, unit_price: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.unit_price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
                  />
                  {errors.unit_price && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit_price}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={itemForm.condition}
                    onChange={(e) => setItemForm({...itemForm, condition: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="expired">Expired</option>
                    <option value="return">Return</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={itemForm.batch_number}
                    onChange={(e) => setItemForm({...itemForm, batch_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional batch number"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={addItemToBatch}
                    disabled={loading || !itemForm.product_id}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Item to Batch
                  </button>
                </div>
              </div>
            </div>

            {batchItems.length > 0 && (
              <div className="bg-white rounded-xl shadow p-4 md:p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Added Items ({batchItems.length})
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {batchItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                {item.product_name || getProductName(item.product_id)}
                              </p>
                              <p className="text-sm text-gray-500">
                                SKU: {item.product_sku || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-900">{item.expected_quantity || 0}</td>
                          <td className="px-4 py-3 text-gray-900">{item.received_quantity}</td>
                          <td className="px-4 py-3 text-gray-900">KSh {parseFloat(item.unit_price || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 font-bold text-green-600">
                            KSh {((item.received_quantity || 0) * parseFloat(item.unit_price || 0)).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => removeItem(index)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                        <td className="px-4 py-3 font-bold text-green-600">
                          KSh {totalValue.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchReceiving;