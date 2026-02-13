from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import random
import string
from app import db
from models import Order, OrderItem, Product, User, Cart, CartItem, InventoryTransaction

order_bp = Blueprint('orders', __name__)

def generate_order_number():
    """Generate unique order number"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M')
    random_str = ''.join(random.choices(string.digits, k=4))
    return f'ORD-{timestamp}-{random_str}'

@order_bp.route('/orders', methods=['POST'])
@jwt_required(optional=True)
def create_order():
    """Create order from cart - ALLOWS GUEST CHECKOUT"""
    try:
        user_id = get_jwt_identity()  # Will be None for guest users
        data = request.get_json()
        
        print(f"📝 Creating order - User ID: {user_id}")
        print(f"   Customer: {data.get('customer_name')}")
        print(f"   Items count: {len(data.get('items', []))}")
        
        # Validate required fields - REMOVED customer_email
        required_fields = ['customer_name', 'customer_phone', 'shipping_address']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Get items
        items = data.get('items', [])
        if not items:
            return jsonify({'error': 'No items in order'}), 400
        
        # Calculate totals
        subtotal = data.get('subtotal', 0)
        tax_amount = data.get('tax_amount', 0)
        shipping_cost = data.get('shipping_cost', 0)
        discount_amount = data.get('discount_amount', 0)
        total_amount = data.get('total_amount', 0)
        
        # Validate totals
        if total_amount <= 0:
            return jsonify({'error': 'Invalid total amount'}), 400
        
        # Generate order number
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_num = random.randint(1000, 9999)
        order_number = f'HNJ-{timestamp}-{random_num}'
        
        # Create order - make email optional
        order = Order(
            order_number=order_number,
            user_id=user_id,
            customer_name=data['customer_name'],
            customer_email=data.get('customer_email', ''),  # Optional with default
            customer_phone=data['customer_phone'],
            shipping_address=data['shipping_address'],
            billing_address=data.get('billing_address', data['shipping_address']),
            subtotal=subtotal,
            tax_amount=tax_amount,
            shipping_cost=shipping_cost,
            discount_amount=discount_amount,
            total_amount=total_amount,
            payment_method=data.get('payment_method', 'pending'),
            payment_status='pending',
            order_status='pending',
            notes=data.get('notes', '')
        )
        
        db.session.add(order)
        db.session.flush()  # Get order ID without committing
        
        # Create order items
        for item_data in items:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity', 1)
            unit_price = item_data.get('unit_price', 0)
            total_price = item_data.get('total_price', unit_price * quantity)
            
            if not product_id:
                raise ValueError('product_id is required for order items')
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product_id,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                discount=item_data.get('discount', 0)
            )
            db.session.add(order_item)
        
        db.session.commit()
        
        print(f"✅ Order created successfully!")
        print(f"   Order ID: {order.id}")
        print(f"   Order Number: {order.order_number}")
        print(f"   Total Amount: {order.total_amount}")
        print(f"   Items: {len(order.items)}")
        
        return jsonify({
            'success': True,
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Order creation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@order_bp.route('/orders/user', methods=['GET'])
@jwt_required()
def get_user_orders():
    """Get all orders for current user"""
    try:
        user_id = get_jwt_identity()
        
        status = request.args.get('status')
        limit = request.args.get('limit', 20)
        offset = request.args.get('offset', 0)
        
        query = Order.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(order_status=status)
        
        total = query.count()
        orders = query.order_by(Order.created_at.desc())\
                     .offset(int(offset))\
                     .limit(int(limit))\
                     .all()
        
        return jsonify({
            'orders': [order.to_dict() for order in orders],
            'total': total,
            'offset': int(offset),
            'limit': int(limit)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@order_bp.route('/orders/<string:order_number>', methods=['GET'])
@jwt_required()
def get_order(order_number):
    """Get specific order details"""
    try:
        user_id = get_jwt_identity()
        
        order = Order.query.filter_by(order_number=order_number).first_or_404()
        
        # Check authorization
        user = User.query.get(user_id)
        if order.user_id != user_id and user.role not in ['admin', 'staff']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify(order.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@order_bp.route('/orders/<string:order_number>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_number):
    """Cancel order"""
    try:
        user_id = get_jwt_identity()
        
        order = Order.query.filter_by(order_number=order_number).first_or_404()
        
        # Check authorization
        if order.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if order can be cancelled
        if order.order_status not in ['pending', 'confirmed']:
            return jsonify({
                'error': f'Cannot cancel order in {order.order_status} status'
            }), 400
        
        # Restore stock
        for order_item in order.items:
            product = Product.query.get(order_item.product_id)
            if product:
                product.stock_quantity += order_item.quantity
                
                # Create inventory transaction
                inv_transaction = InventoryTransaction(
                    product_id=product.id,
                    quantity=order_item.quantity,
                    transaction_type='restock',
                    reference_id=order.id,
                    notes=f'Restocked from cancelled order {order.order_number}'
                )
                db.session.add(inv_transaction)
        
        order.order_status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'message': 'Order cancelled',
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@order_bp.route('/orders/<int:order_id>/payment-status', methods=['GET', 'OPTIONS'])
def check_order_payment_status(order_id):
    # Handle OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response
    
    try:
        # Get order from database
        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Check if there are any successful payments for this order
        payment = Payment.query.filter_by(order_id=order_id).first()
        
        # Check if payment exists and was successful
        is_paid = False
        payment_data = None
        
        if payment:
            # Check payment status - adjust based on your Payment model
            if hasattr(payment, 'status'):
                is_paid = payment.status == 'successful' or payment.status == 'completed'
            else:
                # If no status field, assume payment with receipt is successful
                is_paid = bool(payment.mpesa_receipt)
            
            payment_data = {
                'receipt': payment.mpesa_receipt if hasattr(payment, 'mpesa_receipt') else None,
                'amount': float(payment.amount) if hasattr(payment, 'amount') else None,
                'phone': payment.phone if hasattr(payment, 'phone') else None,
                'date': payment.created_at.isoformat() if hasattr(payment, 'created_at') else None,
                'status': payment.status if hasattr(payment, 'status') else 'completed'
            }
        
        # Also check order status itself
        order_is_paid = order.status == 'paid' if hasattr(order, 'status') else is_paid
        
        response = jsonify({
            'success': True,
            'order_id': order_id,
            'order_number': order.order_number,
            'paid': order_is_paid or is_paid,
            'order_status': order.status if hasattr(order, 'status') else None,
            'payment': payment_data
        })
        
        # Add CORS headers
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response
        
    except Exception as e:
        print(f"❌ Error checking payment status for order {order_id}: {str(e)}")
        response = jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        })
        response.status_code = 500
        response.headers.add("Access-Control-Allow-Origin", "*")
        return response