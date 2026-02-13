# ~/hnj/backend/models.py - FIXED DUPLICATE BACKREF
from datetime import datetime
from flask_bcrypt import generate_password_hash, check_password_hash
from app import db
import json

# ==================== TOKEN BLACKLIST ====================
class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'jti': self.jti,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ==================== SUPPLIER MODEL ====================
class Supplier(db.Model):
    __tablename__ = 'suppliers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    tax_id = db.Column(db.String(50))
    payment_terms = db.Column(db.String(100))
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships - use string names for forward references
    batches = db.relationship('ReceivingBatch', backref='supplier', lazy=True)
    products = db.relationship('Product', backref='supplier', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'contact_person': self.contact_person,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'tax_id': self.tax_id,
            'payment_terms': self.payment_terms,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ==================== PRODUCT CLASSIFICATION SYSTEM ====================
class ProductCategory(db.Model):
    """Broad product classification (e.g., Kitchen & Dining Ware)"""
    __tablename__ = 'product_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subcategories = db.relationship('ProductSubCategory', backref='category', lazy=True, cascade='all, delete-orphan')
    products = db.relationship('Product', backref='broad_category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'product_count': len(self.products) if self.products else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ProductSubCategory(db.Model):
    """Sub-classification within categories (e.g., Cookware, Bakeware)"""
    __tablename__ = 'product_subcategories'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('product_categories.id'), nullable=False)
    code = db.Column(db.String(10), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    products = db.relationship('Product', backref='subcategory', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'category_code': self.category.code if self.category else None,
            'code': self.code,
            'name': self.name,
            'description': self.description,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'product_count': len(self.products) if self.products else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ==================== PRODUCT MODEL ====================
class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Classification fields
    category_id = db.Column(db.Integer, db.ForeignKey('product_categories.id'))
    subcategory_id = db.Column(db.Integer, db.ForeignKey('product_subcategories.id'))
    
    # Product attributes
    brand = db.Column(db.String(100))
    model = db.Column(db.String(100))
    color = db.Column(db.String(50))
    size = db.Column(db.String(50))
    material = db.Column(db.String(100))
    weight = db.Column(db.Numeric(10, 2))
    dimensions = db.Column(db.String(50))
    unit_of_measure = db.Column(db.String(20), default='pcs')
    
    # Pricing and stock
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    cost_price = db.Column(db.Numeric(10, 2))
    selling_price = db.Column(db.Numeric(10, 2), default=0)
    profit_margin = db.Column(db.Numeric(5, 2))
    stock_quantity = db.Column(db.Integer, default=0)
    reserved_quantity = db.Column(db.Integer, default=0)
    available_quantity = db.Column(db.Integer, default=0)
    min_stock_level = db.Column(db.Integer, default=10)
    max_stock_level = db.Column(db.Integer, default=100)
    reorder_quantity = db.Column(db.Integer, default=20)
    
    # Barcode and identification
    barcode = db.Column(db.String(100), unique=True)
    supplier_sku = db.Column(db.String(50))
    
    # Supplier relationship
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    
    # Media and specifications
    image_urls = db.Column(db.JSON)
    specifications = db.Column(db.JSON)
    
    # Status flags
    is_active = db.Column(db.Boolean, default=True)
    is_on_offer = db.Column(db.Boolean, default=False)
    is_featured = db.Column(db.Boolean, default=False)
    is_new_arrival = db.Column(db.Boolean, default=True)
    is_best_seller = db.Column(db.Boolean, default=False)
    
    # Pricing offers
    offer_price = db.Column(db.Numeric(10, 2))
    discount_percentage = db.Column(db.Integer)
    offer_start_date = db.Column(db.DateTime)
    offer_end_date = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch_items = db.relationship('BatchItem', backref='product', lazy=True, cascade='all, delete-orphan')
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    cart_items = db.relationship('CartItem', backref='product', lazy=True)
    wishlist_items = db.relationship('WishlistItem', backref='product', lazy=True)
    inventory_transactions = db.relationship('InventoryTransaction', backref='product', lazy=True)
    barcode_history = db.relationship('BarcodeHistory', backref='product', lazy=True)
    
    def __init__(self, *args, **kwargs):
        # Handle stock quantities safely
        stock_qty = kwargs.get('stock_quantity', 0)
        reserved_qty = kwargs.get('reserved_quantity', 0)
        
        if stock_qty is None:
            stock_qty = 0
        if reserved_qty is None:
            reserved_qty = 0
            
        kwargs['available_quantity'] = stock_qty - reserved_qty
        
        if 'reserved_quantity' not in kwargs or kwargs['reserved_quantity'] is None:
            kwargs['reserved_quantity'] = 0
            
        super().__init__(*args, **kwargs)
    
    def update_available_quantity(self):
        stock = self.stock_quantity or 0
        reserved = self.reserved_quantity or 0
        self.available_quantity = stock - reserved
        return self.available_quantity
    
    def to_dict(self):
        stock = self.stock_quantity or 0
        reserved = self.reserved_quantity or 0
        available = stock - reserved
        
        return {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'description': self.description,
            'category': self.broad_category.to_dict() if self.broad_category else None,
            'subcategory': self.subcategory.to_dict() if self.subcategory else None,
            'brand': self.brand,
            'model': self.model,
            'color': self.color,
            'size': self.size,
            'material': self.material,
            'weight': float(self.weight) if self.weight else None,
            'dimensions': self.dimensions,
            'unit_of_measure': self.unit_of_measure or 'pcs',
            'cost_price': float(self.cost_price) if self.cost_price else None,
            'selling_price': float(self.selling_price) if self.selling_price else None,
            'profit_margin': float(self.profit_margin) if self.profit_margin else None,
            'stock_quantity': stock,
            'reserved_quantity': reserved,
            'available_quantity': available,
            'min_stock_level': self.min_stock_level or 10,
            'max_stock_level': self.max_stock_level or 100,
            'reorder_quantity': self.reorder_quantity or 20,
            'barcode': self.barcode,
            'supplier': self.supplier.to_dict() if self.supplier else None,
            'supplier_sku': self.supplier_sku,
            'image_urls': self.image_urls or [],
            'specifications': self.specifications or {},
            'is_active': self.is_active if self.is_active is not None else True,
            'is_on_offer': self.is_on_offer if self.is_on_offer is not None else False,
            'is_featured': self.is_featured if self.is_featured is not None else False,
            'is_new_arrival': self.is_new_arrival if self.is_new_arrival is not None else True,
            'is_best_seller': self.is_best_seller if self.is_best_seller is not None else False,
            'offer_price': float(self.offer_price) if self.offer_price else None,
            'discount_percentage': self.discount_percentage,
            'offer_start_date': self.offer_start_date.isoformat() if self.offer_start_date else None,
            'offer_end_date': self.offer_end_date.isoformat() if self.offer_end_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# ==================== RECEIVING BATCH MODEL ====================
class ReceivingBatch(db.Model):
    __tablename__ = 'receiving_batches'
    
    id = db.Column(db.Integer, primary_key=True)
    batch_number = db.Column(db.String(50), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    invoice_number = db.Column(db.String(100))
    delivery_date = db.Column(db.Date)
    delivery_notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='draft')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    submitted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    submitted_at = db.Column(db.DateTime)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_at = db.Column(db.DateTime)
    total_items = db.Column(db.Integer, default=0)
    total_value = db.Column(db.Numeric(15, 2), default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    batch_items = db.relationship('BatchItem', backref='batch', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'batch_number': self.batch_number,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.name if self.supplier else None,
            'invoice_number': self.invoice_number,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'delivery_notes': self.delivery_notes,
            'status': self.status,
            'created_by': self.created_by,
            'submitted_by': self.submitted_by,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_by': self.reviewed_by,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'total_items': self.total_items,
            'total_value': float(self.total_value) if self.total_value else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class BatchItem(db.Model):
    __tablename__ = 'batch_items'
    
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('receiving_batches.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    product_sku = db.Column(db.String(50))
    product_name = db.Column(db.String(200))
    expected_quantity = db.Column(db.Integer, default=0)
    received_quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='pending')
    condition = db.Column(db.String(20), default='good')
    rejection_reason = db.Column(db.String(100))
    rejection_comments = db.Column(db.Text)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    storage_location = db.Column(db.String(50))
    barcode = db.Column(db.String(100))
    qr_code_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    barcode_history = db.relationship('BarcodeHistory', backref='batch_item', lazy=True)
    
    def to_dict(self):
        total_price = self.received_quantity * float(self.unit_price) if self.unit_price else 0
        
        return {
            'id': self.id,
            'batch_id': self.batch_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'product_sku': self.product_sku,
            'product_name': self.product_name,
            'expected_quantity': self.expected_quantity,
            'received_quantity': self.received_quantity,
            'unit_price': float(self.unit_price) if self.unit_price else None,
            'total_price': total_price,
            'status': self.status,
            'condition': self.condition,
            'rejection_reason': self.rejection_reason,
            'rejection_comments': self.rejection_comments,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'storage_location': self.storage_location,
            'barcode': self.barcode,
            'qr_code_data': self.qr_code_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# ==================== USER MODEL ====================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')
    full_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    is_blocked = db.Column(db.Boolean, default=False)
    
    # Relationships - using string names for forward references
    created_batches = db.relationship('ReceivingBatch', 
                                    foreign_keys='ReceivingBatch.created_by', 
                                    backref='creator', 
                                    lazy=True)
    submitted_batches = db.relationship('ReceivingBatch', 
                                      foreign_keys='ReceivingBatch.submitted_by', 
                                      backref='submitter', 
                                      lazy=True)
    reviewed_batches = db.relationship('ReceivingBatch', 
                                     foreign_keys='ReceivingBatch.reviewed_by', 
                                     backref='reviewer', 
                                     lazy=True)
    approved_items = db.relationship('BatchItem', 
                                   foreign_keys='BatchItem.approved_by', 
                                   backref='approver', 
                                   lazy=True)
    # FIXED: Changed backref name to avoid duplicate
    generated_barcodes = db.relationship('BarcodeHistory', 
                                       foreign_keys='BarcodeHistory.generated_by', 
                                       backref='user_generator',  # CHANGED from 'generator' to 'user_generator'
                                       lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'full_name': self.full_name,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ==================== CART MODELS ====================
class Cart(db.Model):
    __tablename__ = 'carts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cart_items = db.relationship('CartItem', backref='cart', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'session_id': self.session_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class CartItem(db.Model):
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cart_id': self.cart_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }

# ==================== WISHLIST MODELS ====================
class Wishlist(db.Model):
    __tablename__ = 'wishlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    wishlist_items = db.relationship('WishlistItem', backref='wishlist', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class WishlistItem(db.Model):
    __tablename__ = 'wishlist_items'
    
    id = db.Column(db.Integer, primary_key=True)
    wishlist_id = db.Column(db.Integer, db.ForeignKey('wishlists.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'wishlist_id': self.wishlist_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }

# ==================== ORDER MODELS ====================
class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(100), nullable=True)
    customer_phone = db.Column(db.String(20))
    shipping_address = db.Column(db.Text)
    billing_address = db.Column(db.Text)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    tax_amount = db.Column(db.Numeric(10, 2), default=0)
    shipping_cost = db.Column(db.Numeric(10, 2), default=0)
    discount_amount = db.Column(db.Numeric(10, 2), default=0)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50))
    payment_status = db.Column(db.String(20), default='pending')
    order_status = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='order', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'user_id': self.user_id,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'shipping_address': self.shipping_address,
            'billing_address': self.billing_address,
            'subtotal': float(self.subtotal) if self.subtotal else None,
            'tax_amount': float(self.tax_amount) if self.tax_amount else None,
            'shipping_cost': float(self.shipping_cost) if self.shipping_cost else None,
            'discount_amount': float(self.discount_amount) if self.discount_amount else None,
            'total_amount': float(self.total_amount) if self.total_amount else None,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'order_status': self.order_status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    discount = db.Column(db.Numeric(10, 2), default=0)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price) if self.unit_price else None,
            'discount': float(self.discount) if self.discount else None,
            'total_price': float(self.total_price) if self.total_price else None
        }

# ==================== PAYMENT MODEL ====================
class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    transaction_id = db.Column(db.String(100), unique=True)
    phone_number = db.Column(db.String(20))
    status = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'payment_method': self.payment_method,
            'amount': float(self.amount) if self.amount else None,
            'transaction_id': self.transaction_id,
            'phone_number': self.phone_number,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ==================== INVENTORY TRANSACTION MODEL ====================
class InventoryTransaction(db.Model):
    __tablename__ = 'inventory_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)
    reference_id = db.Column(db.Integer)
    reference_type = db.Column(db.String(50))
    unit_price = db.Column(db.Numeric(10, 2))
    total_value = db.Column(db.Numeric(15, 2))
    previous_stock = db.Column(db.Integer)
    new_stock = db.Column(db.Integer)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='inventory_transactions', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product': self.product.to_dict() if self.product else None,
            'quantity': self.quantity,
            'transaction_type': self.transaction_type,
            'reference_id': self.reference_id,
            'reference_type': self.reference_type,
            'unit_price': float(self.unit_price) if self.unit_price else None,
            'total_value': float(self.total_value) if self.total_value else None,
            'previous_stock': self.previous_stock,
            'new_stock': self.new_stock,
            'notes': self.notes,
            'created_by': self.created_by,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# ==================== BARCODE HISTORY MODEL ====================
class BarcodeHistory(db.Model):
    __tablename__ = 'barcode_history'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    batch_item_id = db.Column(db.Integer, db.ForeignKey('batch_items.id'))
    barcode = db.Column(db.String(100), nullable=False)
    qr_data = db.Column(db.JSON)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # FIXED: Changed backref to match the new name in User model
    generator = db.relationship('User', backref='barcode_history', lazy=True)  # CHANGED backref name
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'batch_item_id': self.batch_item_id,
            'batch_number': self.batch_item.batch.batch_number if self.batch_item and self.batch_item.batch else None,
            'barcode': self.barcode,
            'qr_data': self.qr_data,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'generated_by': self.generated_by,
            'generated_by_name': self.generator.full_name if self.generator else None
        }