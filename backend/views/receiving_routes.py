from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
import json
import uuid
import qrcode
import barcode
from barcode.writer import ImageWriter
from io import BytesIO
import base64

receiving_bp = Blueprint('receiving', __name__)

# ============ HELPER FUNCTIONS ============

def generate_barcode_image(barcode_text):
    """Generate barcode image from text"""
    try:
        # Use Code128 format (most common)
        barcode_class = barcode.get_barcode_class('code128')
        barcode_obj = barcode_class(barcode_text, writer=ImageWriter())
        
        # Save to bytes buffer
        buffer = BytesIO()
        barcode_obj.write(buffer)
        
        # Encode to base64
        barcode_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return {
            'success': True,
            'barcode_text': barcode_text,
            'barcode_image': barcode_base64,
            'format': 'CODE128'
        }
    except Exception as e:
        current_app.logger.error(f"Barcode generation error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def generate_qr_code_image(qr_data):
    """Generate QR code image from data"""
    try:
        # Convert data to JSON string
        qr_content = json.dumps(qr_data)
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_content)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to bytes buffer
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        
        # Encode to base64
        qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return {
            'success': True,
            'qr_data': qr_data,
            'qr_image': qr_base64
        }
    except Exception as e:
        current_app.logger.error(f"QR code generation error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def generate_classification_barcode(product, batch=None):
    """Generate SHORT barcode with category code only - NO SUBCATEGORY"""
    if not product:
        return None
    
    # Get category code (first 2-3 chars) - fallback to 'GN'
    cat_code = 'GN'
    if product.broad_category and product.broad_category.code:
        cat_code = product.broad_category.code[:3].upper()
    
    # Get short product identifier (last 6 chars of SKU, remove special chars)
    sku_short = 'PROD'
    if product.sku:
        # Remove special characters and take last 6 chars
        sku_clean = ''.join(e for e in product.sku if e.isalnum())
        sku_short = sku_clean[-6:] if len(sku_clean) >= 6 else sku_clean
    
    # Get batch ID (last 4 digits)
    batch_id = '0000'
    if batch:
        if hasattr(batch, 'id') and batch.id:
            batch_id = str(batch.id)[-4:]
        elif isinstance(batch, str):
            batch_id = batch[-4:] if len(batch) >= 4 else batch
        elif hasattr(batch, 'batch_number') and batch.batch_number:
            batch_id = batch.batch_number[-4:]
    
    # Format: CAT-SKUSHORT-BATCHID
    # Examples: WB-WB500-3203, PCW-KIDS1-3203, FL-FLSK1-3203, MG-MUG350-1004, KU-SPOON3-1004
    barcode_text = f"{cat_code}-{sku_short}-{batch_id}"
    
    return barcode_text.upper()

# ============ PRODUCT CLASSIFICATION ROUTES ============

@receiving_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    """Get all product categories with subcategories"""
    try:
        from models import ProductCategory
        
        categories = ProductCategory.query.filter_by(is_active=True)\
            .order_by(ProductCategory.sort_order, ProductCategory.name).all()
        
        result = []
        for cat in categories:
            cat_dict = cat.to_dict()
            cat_dict['subcategories'] = [
                sub.to_dict() for sub in cat.subcategories 
                if sub.is_active
            ]
            result.append(cat_dict)
        
        return jsonify({
            'success': True,
            'categories': result
        })
    except Exception as e:
        current_app.logger.error(f"Get categories error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch categories'}), 500

@receiving_bp.route('/categories/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    """Get specific category with products"""
    try:
        from models import ProductCategory
        
        category = ProductCategory.query.get(category_id)
        if not category:
            return jsonify({'success': False, 'message': 'Category not found'}), 404
        
        category_dict = category.to_dict()
        category_dict['subcategories'] = [
            sub.to_dict() for sub in category.subcategories 
            if sub.is_active
        ]
        
        # Get products in this category
        products = [p.to_dict() for p in category.products if p.is_active]
        category_dict['products'] = products
        
        return jsonify({
            'success': True,
            'category': category_dict
        })
    except Exception as e:
        current_app.logger.error(f"Get category error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch category'}), 500

@receiving_bp.route('/products/classify', methods=['POST'])
@jwt_required()
def classify_product():
    """Classify or reclassify a product"""
    try:
        from models import db, Product, ProductCategory, ProductSubCategory
        
        current_user_id = get_jwt_identity()
        data = request.get_json()
        product_id = data.get('product_id')
        category_id = data.get('category_id')
        subcategory_id = data.get('subcategory_id')
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        # Check permissions - only admin, senior, or receiver can classify
        user = User.query.get(current_user_id)
        if user.role not in ['admin', 'senior', 'receiver']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Update classification
        if category_id:
            category = ProductCategory.query.get(category_id)
            if not category:
                return jsonify({'success': False, 'message': 'Category not found'}), 404
            product.category_id = category_id
        
        if subcategory_id:
            subcategory = ProductSubCategory.query.get(subcategory_id)
            if not subcategory:
                return jsonify({'success': False, 'message': 'Subcategory not found'}), 404
            # Verify subcategory belongs to the category
            if subcategory.category_id != product.category_id:
                return jsonify({'success': False, 'message': 'Subcategory does not belong to selected category'}), 400
            product.subcategory_id = subcategory_id
        
        # Regenerate barcode with new classification
        if product.category_id:
            # Generate new barcode
            barcode_text = generate_classification_barcode(product)
            
            # Save to barcode history
            from models import BarcodeHistory
            barcode_history = BarcodeHistory(
                product_id=product.id,
                barcode=barcode_text,
                generated_by=current_user_id
            )
            db.session.add(barcode_history)
            
            # Update product
            product.barcode = barcode_text
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Product classified successfully',
            'product': product.to_dict()
        })
    except Exception as e:
        current_app.logger.error(f"Classify product error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to classify product'}), 500

@receiving_bp.route('/reports/category-sales', methods=['GET'])
@jwt_required()
def get_category_sales_report():
    """Get sales report by category"""
    try:
        from models import db, ProductCategory, InventoryTransaction
        from sqlalchemy import func
        
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Query sales by category
        query = db.session.query(
            ProductCategory.name.label('category_name'),
            ProductCategory.code.label('category_code'),
            func.count(InventoryTransaction.id).label('transaction_count'),
            func.sum(InventoryTransaction.total_value).label('total_sales'),
            func.sum(InventoryTransaction.quantity).label('total_quantity')
        ).join(
            Product, ProductCategory.id == Product.category_id
        ).join(
            InventoryTransaction, Product.id == InventoryTransaction.product_id
        ).filter(
            InventoryTransaction.transaction_type == 'sale'
        )
        
        if start_date:
            query = query.filter(InventoryTransaction.created_at >= start_date)
        if end_date:
            query = query.filter(InventoryTransaction.created_at <= end_date)
        
        results = query.group_by(ProductCategory.name, ProductCategory.code)\
            .order_by(func.sum(InventoryTransaction.total_value).desc()).all()
        
        report = []
        for r in results:
            report.append({
                'category': r.category_name,
                'category_code': r.category_code,
                'transaction_count': r.transaction_count or 0,
                'total_sales': float(r.total_sales or 0),
                'total_quantity': r.total_quantity or 0,
                'avg_sale_value': float(r.total_sales or 0) / (r.transaction_count or 1) if r.transaction_count else 0
            })
        
        return jsonify({
            'success': True,
            'report': report,
            'summary': {
                'total_categories': len(report),
                'total_sales': sum(r['total_sales'] for r in report),
                'total_transactions': sum(r['transaction_count'] for r in report),
                'total_items_sold': sum(r['total_quantity'] for r in report)
            }
        })
    except Exception as e:
        current_app.logger.error(f"Category sales report error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to generate report'}), 500

@receiving_bp.route('/reports/category-stock', methods=['GET'])
@jwt_required()
def get_category_stock_report():
    """Get stock report by category"""
    try:
        from models import ProductCategory
        from sqlalchemy import func
        
        # Get stock levels by category
        categories = ProductCategory.query.filter_by(is_active=True)\
            .order_by(ProductCategory.name).all()
        
        report = []
        for category in categories:
            # Calculate stock values for this category
            total_stock = 0
            total_value = 0
            low_stock_count = 0
            out_of_stock_count = 0
            
            for product in category.products:
                if product.is_active:
                    total_stock += product.stock_quantity
                    total_value += product.stock_quantity * float(product.cost_price or 0)
                    
                    if product.stock_quantity == 0:
                        out_of_stock_count += 1
                    elif product.stock_quantity <= product.min_stock_level:
                        low_stock_count += 1
            
            report.append({
                'category': category.name,
                'category_code': category.code,
                'product_count': len([p for p in category.products if p.is_active]),
                'total_stock': total_stock,
                'total_value': total_value,
                'low_stock_count': low_stock_count,
                'out_of_stock_count': out_of_stock_count
            })
        
        return jsonify({
            'success': True,
            'report': report,
            'summary': {
                'total_categories': len(report),
                'total_products': sum(r['product_count'] for r in report),
                'total_stock': sum(r['total_stock'] for r in report),
                'total_value': sum(r['total_value'] for r in report)
            }
        })
    except Exception as e:
        current_app.logger.error(f"Category stock report error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to generate report'}), 500

# ============ SUPPLIER ROUTES ============

@receiving_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    """Get all suppliers"""
    try:
        from models import Supplier
        
        suppliers = Supplier.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'suppliers': [s.to_dict() for s in suppliers]
        })
    except Exception as e:
        current_app.logger.error(f"Get suppliers error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch suppliers'}), 500

@receiving_bp.route('/suppliers', methods=['POST'])
@jwt_required()
def create_supplier():
    """Create a new supplier"""
    try:
        from models import db, Supplier
        
        data = request.get_json()
        
        supplier = Supplier(
            name=data['name'],
            contact_person=data.get('contact_person'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            tax_id=data.get('tax_id'),
            payment_terms=data.get('payment_terms'),
            notes=data.get('notes')
        )
        
        db.session.add(supplier)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'supplier': supplier.to_dict()
        }), 201
    except Exception as e:
        current_app.logger.error(f"Create supplier error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to create supplier'}), 500

# ============ BATCH RECEIVING ROUTES ============

@receiving_bp.route('/receiving/batches', methods=['POST'])
@jwt_required()
def create_batch():
    """Create a new receiving batch"""
    try:
        from models import db, User, ReceivingBatch
        
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check user role
        user = User.query.get(current_user_id)
        if user.role not in ['admin', 'receiver', 'senior']:
            return jsonify({'success': False, 'message': 'Unauthorized role'}), 403
        
        # Generate batch number
        today = date.today()
        timestamp = int(datetime.utcnow().timestamp() % 10000)
        batch_number = f"BATCH-{today.strftime('%Y%m%d')}-{str(timestamp).zfill(4)}"
        
        batch = ReceivingBatch(
            batch_number=batch_number,
            supplier_id=data.get('supplier_id'),
            invoice_number=data.get('invoice_number'),
            delivery_date=datetime.strptime(data['delivery_date'], '%Y-%m-%d').date() if data.get('delivery_date') else None,
            delivery_notes=data.get('delivery_notes'),
            submitted_by=current_user_id,
            status='draft'
        )
        
        db.session.add(batch)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'batch': batch.to_dict()
        }), 201
    except Exception as e:
        current_app.logger.error(f"Create batch error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to create batch'}), 500

@receiving_bp.route('/receiving/batches/<int:batch_id>/items', methods=['POST'])
@jwt_required()
def add_batch_item(batch_id):
    """Add item to batch"""
    try:
        from models import db, User, ReceivingBatch, Product, BatchItem
        
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Check batch exists and user can modify
        batch = ReceivingBatch.query.get(batch_id)
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404
        
        user = User.query.get(current_user_id)
        if batch.status != 'draft' or (batch.submitted_by != current_user_id and user.role not in ['admin', 'senior']):
            return jsonify({'success': False, 'message': 'Cannot modify this batch'}), 403
        
        # Get product
        product = Product.query.get(data['product_id'])
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        # Create batch item
        batch_item = BatchItem(
            batch_id=batch_id,
            product_id=product.id,
            product_sku=product.sku,
            product_name=product.name,
            expected_quantity=data.get('expected_quantity', 0),
            received_quantity=data['received_quantity'],
            unit_price=data['unit_price'],
            condition=data.get('condition', 'good')
        )
        
        db.session.add(batch_item)
        db.session.commit()
        
        # Update batch totals
        from sqlalchemy import func
        
        result = db.session.query(
            func.count(BatchItem.id),
            func.sum(BatchItem.received_quantity * BatchItem.unit_price)
        ).filter_by(batch_id=batch_id).first()
        
        total_items, total_value = result
        total_value = total_value or 0
        
        batch.total_items = total_items or 0
        batch.total_value = total_value
        db.session.commit()
        
        return jsonify({
            'success': True,
            'item': batch_item.to_dict()
        }), 201
    except Exception as e:
        current_app.logger.error(f"Add batch item error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to add item'}), 500

@receiving_bp.route('/receiving/batches/<int:batch_id>/submit', methods=['POST'])
@jwt_required()
def submit_batch(batch_id):
    """Submit batch for review"""
    try:
        from models import db, User, ReceivingBatch
        
        current_user_id = get_jwt_identity()
        
        batch = ReceivingBatch.query.get(batch_id)
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404
        
        # Check if batch has items
        if not batch.batch_items:
            return jsonify({'success': False, 'message': 'Cannot submit empty batch'}), 400
        
        # Check user permissions
        user = User.query.get(current_user_id)
        if batch.submitted_by != current_user_id and user.role not in ['admin', 'senior']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Update batch status
        batch.status = 'submitted'
        batch.submitted_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Batch submitted for review',
            'batch': batch.to_dict()
        })
    except Exception as e:
        current_app.logger.error(f"Submit batch error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to submit batch'}), 500

@receiving_bp.route('/receiving/batches/pending', methods=['GET'])
@jwt_required()
def get_pending_batches():
    """Get batches pending review (for senior staff)"""
    try:
        from models import User, ReceivingBatch
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # Only senior staff and admins can see pending batches
        if user.role not in ['admin', 'senior','receiver']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Get batches pending review
        batches = ReceivingBatch.query.filter(
            ReceivingBatch.status.in_(['submitted', 'pending_review'])
        ).order_by(ReceivingBatch.submitted_at.desc()).all()
        
        # Format response
        batch_list = []
        for batch in batches:
            batch_dict = batch.to_dict()
            batch_dict['submitted_by_name'] = batch.submitter.full_name if batch.submitter else 'Unknown'
            batch_dict['supplier_name'] = batch.supplier.name if batch.supplier else 'Unknown'
            batch_list.append(batch_dict)
        
        return jsonify({
            'success': True,
            'batches': batch_list
        })
    except Exception as e:
        current_app.logger.error(f"Get pending batches error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch pending batches'}), 500

@receiving_bp.route('/receiving/batches/<int:batch_id>', methods=['GET'])
@jwt_required()
def get_batch_details(batch_id):
    """Get batch details with items"""
    try:
        from models import User, ReceivingBatch, BatchItem
        
        current_user_id = get_jwt_identity()
        
        batch = ReceivingBatch.query.get(batch_id)
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404
        
        # Check permissions
        user = User.query.get(current_user_id)
        if batch.submitted_by != current_user_id and user.role not in ['admin', 'senior']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Get items with product info
        items = []
        for item in batch.batch_items:
            item_dict = item.to_dict()
            if item.product:
                item_dict['current_stock'] = item.product.stock_quantity
                item_dict['product_details'] = item.product.to_dict()
            items.append(item_dict)
        
        batch_dict = batch.to_dict()
        batch_dict['submitted_by_name'] = batch.submitter.full_name if batch.submitter else 'Unknown'
        batch_dict['supplier_details'] = batch.supplier.to_dict() if batch.supplier else None
        
        return jsonify({
            'success': True,
            'batch': batch_dict,
            'items': items
        })
    except Exception as e:
        current_app.logger.error(f"Get batch details error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch batch details'}), 500

# ============ APPROVAL ROUTES ============

@receiving_bp.route('/receiving/batches/<int:batch_id>/items/<int:item_id>/approve', methods=['POST'])
@jwt_required()
def approve_batch_item(batch_id, item_id):
    """Approve or reject a batch item"""
    try:
        from models import db, User, BatchItem, Product, InventoryTransaction, BarcodeHistory
        
        current_user_id = get_jwt_identity()
        data = request.get_json()
        action = data.get('action')  # 'approve' or 'reject'
        
        if action not in ['approve', 'reject']:
            return jsonify({'success': False, 'message': 'Invalid action'}), 400
        
        # Check user permissions
        user = User.query.get(current_user_id)
        if user.role not in ['admin', 'senior']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Find the item
        item = BatchItem.query.filter_by(id=item_id, batch_id=batch_id).first()
        if not item:
            return jsonify({'success': False, 'message': 'Item not found'}), 404
        
        batch = item.batch
        
        # Update item status
        if action == 'approve':
            item.status = 'approved'
            item.approved_by = current_user_id
            item.approved_at = datetime.utcnow()
            item.rejection_reason = None
            item.rejection_comments = None
            
            # Update product stock
            product = item.product
            if product:
                previous_stock = product.stock_quantity
                product.stock_quantity += item.received_quantity
                product.update_available_quantity()  # Update available quantity
                
                # Generate SHORT barcode with classification - PASS BATCH OBJECT
                barcode_text = generate_classification_barcode(product, batch)
                
                if barcode_text:
                    # Generate barcode image
                    barcode_result = generate_barcode_image(barcode_text)
                    
                    # Prepare QR code data
                    qr_data = {
                        'product_id': product.id,
                        'sku': product.sku,
                        'name': product.name,
                        'category': product.broad_category.name if product.broad_category else None,
                        'batch_number': batch.batch_number,
                        'receiving_date': datetime.utcnow().isoformat(),
                        'cost_price': float(product.cost_price) if product.cost_price else None,
                        'selling_price': float(product.selling_price) if product.selling_price else None,
                        'authenticity_url': f"{request.host_url}verify/{product.id}"
                    }
                    
                    # Generate QR code image
                    qr_result = generate_qr_code_image(qr_data)
                    
                    if barcode_result.get('success'):
                        item.barcode = barcode_text
                        item.qr_code_data = qr_data
                        
                        # Save to barcode history
                        barcode_history = BarcodeHistory(
                            product_id=product.id,
                            batch_item_id=item_id,
                            barcode=barcode_text,
                            qr_data=qr_data,
                            generated_by=current_user_id
                        )
                        db.session.add(barcode_history)
                        
                        # Update product with barcode
                        product.barcode = barcode_text
                
                # Create inventory transaction
                transaction = InventoryTransaction(
                    product_id=product.id,
                    quantity=item.received_quantity,
                    transaction_type='receive',
                    reference_id=batch_id,
                    reference_type='batch',
                    unit_price=item.unit_price,
                    total_value=item.received_quantity * item.unit_price,
                    previous_stock=previous_stock,
                    new_stock=product.stock_quantity,
                    notes=f"Batch receive: {batch.batch_number}",
                    created_by=current_user_id
                )
                db.session.add(transaction)
        else:  # reject
            item.status = 'rejected'
            item.approved_by = current_user_id
            item.approved_at = datetime.utcnow()
            item.rejection_reason = data.get('rejection_reason')
            item.rejection_comments = data.get('rejection_comments')
        
        # Update batch status to under review
        batch.status = 'pending_review'
        batch.reviewed_by = current_user_id
        batch.reviewed_at = datetime.utcnow()
        
        # Check if all items are processed
        pending_items = BatchItem.query.filter_by(batch_id=batch_id, status='pending').count()
        if pending_items == 0:
            # Determine final batch status
            approved_items = BatchItem.query.filter_by(batch_id=batch_id, status='approved').count()
            rejected_items = BatchItem.query.filter_by(batch_id=batch_id, status='rejected').count()
            
            if approved_items > 0 and rejected_items > 0:
                batch.status = 'partially_approved'
            elif approved_items > 0:
                batch.status = 'approved'
            else:
                batch.status = 'rejected'
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Item {action}ed successfully',
            'item': item.to_dict(),
            'batch_status': batch.status,
            'barcode': item.barcode if action == 'approve' else None
        })
    except Exception as e:
        current_app.logger.error(f"Approve item error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to {action} item'}), 500

# ============ BARCODE ROUTES ============

@receiving_bp.route('/barcode/generate', methods=['POST'])
@jwt_required()
def generate_barcode_route():
    """Generate barcode for a product with classification"""
    try:
        from models import db, Product, BarcodeHistory
        
        current_user_id = get_jwt_identity()
        data = request.get_json()
        product_id = data.get('product_id')
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        batch_number = data.get('batch_number', '')
        
        # Generate barcode with classification
        barcode_text = generate_classification_barcode(product, batch_number)
        
        if not barcode_text:
            return jsonify({'success': False, 'message': 'Failed to generate barcode'}), 500
        
        barcode_result = generate_barcode_image(barcode_text)
        if not barcode_result['success']:
            return jsonify(barcode_result), 500
        
        # Save to barcode history
        barcode_history = BarcodeHistory(
            product_id=product.id,
            barcode=barcode_text,
            generated_by=current_user_id
        )
        db.session.add(barcode_history)
        
        # Update product
        product.barcode = barcode_text
        db.session.commit()
        
        return jsonify({
            'success': True,
            'barcode': barcode_result,
            'product': product.to_dict()
        })
    except Exception as e:
        current_app.logger.error(f"Generate barcode error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to generate barcode'}), 500

@receiving_bp.route('/barcode/scan', methods=['POST'])
@jwt_required(optional=True)
def scan_barcode():
    """Process barcode scan"""
    try:
        from models import Product
        
        data = request.get_json()
        barcode_text = data.get('barcode')
        
        if not barcode_text:
            return jsonify({'success': False, 'message': 'No barcode provided'}), 400
        
        # Try to find product by barcode
        product = Product.query.filter_by(barcode=barcode_text).first()
        
        if product:
            # Get classification info
            classification_info = {
                'category': product.broad_category.name if product.broad_category else None,
                'category_code': product.broad_category.code if product.broad_category else None,
            }
            
            return jsonify({
                'success': True,
                'product': product.to_dict(),
                'classification': classification_info
            })
        
        return jsonify({'success': False, 'message': 'Product not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Scan barcode error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to scan barcode'}), 500

@receiving_bp.route('/barcode/<string:barcode>', methods=['GET'])
@jwt_required()
def get_barcode_info(barcode):
    """Get detailed information about a barcode"""
    try:
        from models import Product, BatchItem, BarcodeHistory
        
        # Check product
        product = Product.query.filter_by(barcode=barcode).first()
        if product:
            return jsonify({
                'success': True,
                'type': 'product',
                'product': product.to_dict(),
                'classification': {
                    'category': product.broad_category.to_dict() if product.broad_category else None
                }
            })
        
        # Check batch item
        batch_item = BatchItem.query.filter_by(barcode=barcode).first()
        if batch_item:
            return jsonify({
                'success': True,
                'type': 'batch_item',
                'batch_item': batch_item.to_dict(),
                'product': batch_item.product.to_dict() if batch_item.product else None
            })
        
        # Check barcode history
        barcode_history = BarcodeHistory.query.filter_by(barcode=barcode).first()
        if barcode_history:
            return jsonify({
                'success': True,
                'type': 'history',
                'barcode_history': barcode_history.to_dict(),
                'product': barcode_history.product.to_dict() if barcode_history.product else None
            })
        
        return jsonify({'success': False, 'message': 'Barcode not found'}), 404
    except Exception as e:
        current_app.logger.error(f"Get barcode info error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch barcode info'}), 500

@receiving_bp.route('/qrcode/<int:product_id>', methods=['GET'])
def get_qr_code(product_id):
    """Get QR code for a product with classification"""
    try:
        from models import Product
        
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'success': False, 'message': 'Product not found'}), 404
        
        # Prepare QR code data
        qr_data = {
            'product_id': product.id,
            'sku': product.sku,
            'name': product.name,
            'category': product.broad_category.name if product.broad_category else None,
            'price': float(product.selling_price) if product.selling_price else None,
            'stock': product.stock_quantity,
            'barcode': product.barcode,
            'authenticity_url': f"{request.host_url}verify/{product.id}"
        }
        
        # Generate QR code
        qr_result = generate_qr_code_image(qr_data)
        if not qr_result['success']:
            return jsonify(qr_result), 500
        
        return jsonify({
            'success': True,
            'qr_code': qr_result
        })
    except Exception as e:
        current_app.logger.error(f"Get QR code error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to generate QR code'}), 500

# ============ USER BATCHES ROUTES ============

@receiving_bp.route('/receiving/my-batches', methods=['GET'])
@jwt_required()
def get_my_batches():
    """Get batches submitted by current user"""
    try:
        from models import ReceivingBatch
        
        current_user_id = get_jwt_identity()
        
        batches = ReceivingBatch.query.filter_by(submitted_by=current_user_id)\
            .order_by(ReceivingBatch.created_at.desc()).all()
        
        batch_list = []
        for batch in batches:
            batch_dict = batch.to_dict()
            batch_dict['supplier_name'] = batch.supplier.name if batch.supplier else 'Unknown'
            batch_list.append(batch_dict)
        
        return jsonify({
            'success': True,
            'batches': batch_list
        })
    except Exception as e:
        current_app.logger.error(f"Get my batches error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch batches'}), 500

@receiving_bp.route('/receiving/batches/<int:batch_id>/complete', methods=['POST'])
@jwt_required()
def complete_batch(batch_id):
    """Mark batch as completed"""
    try:
        from models import db, User, ReceivingBatch
        
        current_user_id = get_jwt_identity()
        
        batch = ReceivingBatch.query.get(batch_id)
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404
        
        # Check permissions - only admin or senior can complete
        user = User.query.get(current_user_id)
        if user.role not in ['admin', 'senior']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Batch must be approved or partially approved
        if batch.status not in ['approved', 'partially_approved']:
            return jsonify({'success': False, 'message': 'Batch must be approved first'}), 400
        
        batch.status = 'completed'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Batch marked as completed',
            'batch': batch.to_dict()
        })
    except Exception as e:
        current_app.logger.error(f"Complete batch error: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to complete batch'}), 500

# ============ INVENTORY ROUTES ============

@receiving_bp.route('/inventory/transactions', methods=['GET'])
@jwt_required()
def get_inventory_transactions():
    """Get inventory transactions"""
    try:
        from models import InventoryTransaction
        from sqlalchemy import desc
        
        transactions = InventoryTransaction.query.order_by(desc(InventoryTransaction.created_at)).limit(100).all()
        
        return jsonify({
            'success': True,
            'transactions': [t.to_dict() for t in transactions]
        })
    except Exception as e:
        current_app.logger.error(f"Get inventory transactions error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch transactions'}), 500

# ============ PRODUCT SEARCH ============

@receiving_bp.route('/products/search', methods=['GET'])
@jwt_required()
def search_products():
    """Search products with classification filtering"""
    try:
        from models import Product, ProductCategory
        from sqlalchemy import or_
        
        search_term = request.args.get('q', '')
        category_id = request.args.get('category_id')
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        query = Product.query
        
        # Apply filters
        if search_term:
            query = query.filter(or_(
                Product.name.ilike(f'%{search_term}%'),
                Product.sku.ilike(f'%{search_term}%'),
                Product.description.ilike(f'%{search_term}%'),
                Product.barcode.ilike(f'%{search_term}%')
            ))
        
        if category_id:
            query = query.filter(Product.category_id == category_id)
        
        if not include_inactive:
            query = query.filter(Product.is_active == True)
        
        # Execute query
        products = query.order_by(Product.name).limit(50).all()
        
        return jsonify({
            'success': True,
            'products': [p.to_dict() for p in products],
            'count': len(products)
        })
    except Exception as e:
        current_app.logger.error(f"Search products error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to search products'}), 500

# ============ REJECTED BATCHES FOR RECEIVER ============

@receiving_bp.route('/receiving/my-rejected-batches', methods=['GET'])
@jwt_required()
def get_my_rejected_batches():
    """Get batches that were rejected for the current receiver"""
    try:
        from models import ReceivingBatch, BatchItem
        
        current_user_id = get_jwt_identity()
        
        # Get batches submitted by current user that are rejected or partially approved
        batches = ReceivingBatch.query.filter(
            ReceivingBatch.submitted_by == current_user_id,
            ReceivingBatch.status.in_(['rejected', 'partially_approved'])
        ).order_by(ReceivingBatch.updated_at.desc()).all()
        
        result = []
        for batch in batches:
            batch_dict = batch.to_dict()
            
            # Get rejected items for this batch
            rejected_items = BatchItem.query.filter_by(
                batch_id=batch.id,
                status='rejected'
            ).all()
            
            batch_dict['rejected_items'] = [item.to_dict() for item in rejected_items]
            batch_dict['rejection_count'] = len(rejected_items)
            batch_dict['supplier_name'] = batch.supplier.name if batch.supplier else 'Unknown'
            batch_dict['reviewed_by_name'] = batch.reviewer.full_name if batch.reviewer else 'Unknown'
            
            result.append(batch_dict)
        
        return jsonify({
            'success': True,
            'batches': result,
            'count': len(result)
        })
        
    except Exception as e:
        current_app.logger.error(f"Get rejected batches error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch rejected batches'}), 500

@receiving_bp.route('/receiving/batches/<int:batch_id>/rejection-details', methods=['GET'])
@jwt_required()
def get_batch_rejection_details(batch_id):
    """Get detailed rejection reasons for a specific batch"""
    try:
        from models import ReceivingBatch, BatchItem, User
        
        current_user_id = get_jwt_identity()
        
        batch = ReceivingBatch.query.get(batch_id)
        if not batch:
            return jsonify({'success': False, 'message': 'Batch not found'}), 404
        
        # Check if user owns this batch
        if batch.submitted_by != current_user_id:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Get all rejected items with their rejection reasons
        rejected_items = BatchItem.query.filter_by(
            batch_id=batch_id,
            status='rejected'
        ).all()
        
        items_with_reasons = []
        for item in rejected_items:
            item_dict = item.to_dict()
            # Get approver info
            approver = User.query.get(item.approved_by)
            item_dict['approved_by_name'] = approver.full_name if approver else 'Unknown'
            item_dict['product_details'] = item.product.to_dict() if item.product else None
            items_with_reasons.append(item_dict)
        
        return jsonify({
            'success': True,
            'batch': batch.to_dict(),
            'rejected_items': items_with_reasons,
            'supplier_name': batch.supplier.name if batch.supplier else 'Unknown',
            'submitted_by_name': batch.submitter.full_name if batch.submitter else 'Unknown',
            'reviewed_by_name': batch.reviewer.full_name if batch.reviewer else 'Unknown'
        })
        
    except Exception as e:
        current_app.logger.error(f"Get rejection details error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch rejection details'}), 500

# ============ SALES ENDPOINT FOR DASHBOARD ============

@receiving_bp.route('/sales/recent', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)
def get_recent_sales():
    """Get recent sales - for dashboard"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'success': True})
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    
    try:
        # Return empty array for now - you can implement actual sales query later
        return jsonify({
            'success': True,
            'sales': []
        })
    except Exception as e:
        current_app.logger.error(f"Get recent sales error: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch sales'}), 500

# Error handlers
@receiving_bp.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Resource not found'}), 404

@receiving_bp.errorhandler(500)
def internal_error(error):
    current_app.logger.error(f'Server Error: {error}')
    return jsonify({'success': False, 'message': 'Internal server error'}), 500