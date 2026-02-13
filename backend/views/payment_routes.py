from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import random
from app import db
from models import Payment, Order, User, InventoryTransaction, Product

payment_bp = Blueprint('payments', __name__)

@payment_bp.route('/initiate', methods=['POST'])
@jwt_required()
def initiate_payment():
    """Initiate payment for order"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        order_number = data.get('order_number')
        payment_method = data.get('payment_method')
        
        if not order_number or not payment_method:
            return jsonify({'error': 'Order number and payment method required'}), 400
        
        order = Order.query.filter_by(order_number=order_number).first_or_404()
        
        # Check authorization
        if order.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if already paid
        if order.payment_status == 'paid':
            return jsonify({'error': 'Order already paid'}), 400
        
        # Validate payment method
        valid_methods = ['mpesa', 'till', 'cash']
        if payment_method not in valid_methods:
            return jsonify({'error': 'Invalid payment method'}), 400
        
        # Create payment record
        payment = Payment(
            order_id=order.id,
            payment_method=payment_method,
            amount=order.total_amount,
            phone_number=data.get('phone_number') if payment_method == 'mpesa' else None,
            status='pending'
        )
        
        db.session.add(payment)
        db.session.commit()
        
        # For demo, auto-confirm non-till payments
        if payment_method in ['mpesa', 'cash']:
            return complete_payment(payment.id, user_id)
        
        return jsonify({
            'message': 'Payment initiated',
            'payment': payment.to_dict(),
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def complete_payment(payment_id, user_id):
    """Complete payment process"""
    try:
        payment = Payment.query.get_or_404(payment_id)
        order = Order.query.get(payment.order_id)
        
        # Generate transaction ID
        if payment.payment_method == 'mpesa':
            payment.transaction_id = f"MP{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(1000, 9999)}"
        elif payment.payment_method == 'cash':
            payment.transaction_id = f"CASH{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        payment.status = 'completed'
        payment.notes = 'Payment completed successfully'
        
        # Update order
        order.payment_status = 'paid'
        order.payment_method = payment.payment_method
        
        # Only confirm order if it was pending
        if order.order_status == 'pending':
            order.order_status = 'confirmed'
        
        # Update inventory transactions from reserved to sold
        if order.order_status == 'confirmed':
            for item in order.items:
                # Find and update the reservation transaction
                inv_transaction = InventoryTransaction.query.filter_by(
                    product_id=item.product_id,
                    reference_id=order.id,
                    transaction_type='sale_reserved'
                ).first()
                
                if inv_transaction:
                    inv_transaction.transaction_type = 'sale'
                    inv_transaction.notes = f'Sale completed for order {order.order_number}'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment completed successfully',
            'payment': payment.to_dict(),
            'order': order.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/till/confirm', methods=['POST'])
@jwt_required()
def confirm_till_payment():
    """Confirm till payment (staff only)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if user.role not in ['admin', 'staff']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        payment_id = data.get('payment_id')
        confirmed = data.get('confirmed', False)
        till_number = data.get('till_number')
        
        if not payment_id or not till_number:
            return jsonify({'error': 'Payment ID and till number required'}), 400
        
        payment = Payment.query.get_or_404(payment_id)
        order = Order.query.get(payment.order_id)
        
        payment.transaction_id = till_number
        
        if confirmed:
            return complete_payment(payment_id, user_id)
        else:
            payment.status = 'failed'
            payment.notes = data.get('reason', 'Payment rejected')
            
            # Restore stock
            for item in order.items:
                product = Product.query.get(item.product_id)
                if product:
                    product.stock_quantity += item.quantity
                    
                    # Remove reservation transaction
                    InventoryTransaction.query.filter_by(
                        product_id=product.id,
                        reference_id=order.id,
                        transaction_type='sale_reserved'
                    ).delete()
            
            order.order_status = 'cancelled'
            db.session.commit()
            
            return jsonify({
                'message': 'Payment rejected',
                'payment': payment.to_dict(),
                'order': order.to_dict()
            }), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@payment_bp.route('/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    """Get payment details"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        payment = Payment.query.get_or_404(payment_id)
        order = Order.query.get(payment.order_id)
        
        # Check authorization
        if order.user_id != user_id and user.role not in ['admin', 'staff']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify(payment.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500