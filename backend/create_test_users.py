#!/usr/bin/env python3
"""
Script to create test users for inventory system
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from models import User
from werkzeug.security import generate_password_hash

app = create_app()

with app.app_context():
    # Test users to create
    test_users = [
        {
            'username': 'receiver1',
            'email': 'receiver@store.com',
            'password': 'receiver123',
            'full_name': 'John Receiver',
            'role': 'receiver',
            'phone': '0712345678',
            'is_active': True
        },
        {
            'username': 'senior1',
            'email': 'senior@store.com',
            'password': 'senior123',
            'full_name': 'Jane Senior',
            'role': 'senior',
            'phone': '0723456789',
            'is_active': True
        },
        {
            'username': 'manager1',
            'email': 'manager@store.com',
            'password': 'manager123',
            'full_name': 'Bob Manager',
            'role': 'manager',
            'phone': '0734567890',
            'is_active': True
        },
        {
            'username': 'cashier1',
            'email': 'cashier@store.com',
            'password': 'cashier123',
            'full_name': 'Alice Cashier',
            'role': 'cashier',
            'phone': '0745678901',
            'is_active': True
        },
        {
            'username': 'customer1',
            'email': 'customer@store.com',
            'password': 'customer123',
            'full_name': 'Mike Customer',
            'role': 'customer',
            'phone': '0756789012',
            'is_active': True
        }
    ]
    
    print("🔧 Creating test users...")
    print("="*60)
    
    created_count = 0
    for user_data in test_users:
        existing = User.query.filter_by(username=user_data['username']).first()
        
        if existing:
            print(f"⚠️  User exists: {user_data['username']}")
            # Update
            existing.email = user_data['email']
            existing.full_name = user_data['full_name']
            existing.role = user_data['role']
            existing.phone = user_data['phone']
            existing.is_active = user_data['is_active']
            db.session.commit()
        else:
            user = User(
                username=user_data['username'],
                email=user_data['email'],
                full_name=user_data['full_name'],
                role=user_data['role'],
                phone=user_data['phone'],
                is_active=user_data['is_active']
            )
            user.password_hash = generate_password_hash(user_data['password'])
            db.session.add(user)
            print(f"✅ Created: {user_data['username']} ({user_data['role']})")
            created_count += 1
    
    db.session.commit()
    
    print("\n" + "="*60)
    print(f"🎉 Created {created_count} new users!")
    
    # List users
    print("\n📋 ALL USERS:")
    print("="*60)
    users = User.query.all()
    for user in users:
        print(f"{user.username:12} | {user.role:10} | {user.email}")
    
    print("\n🔐 TEST CREDENTIALS:")
    print("="*60)
    for user in test_users:
        print(f"\n{user['role']:10}: {user['username']}")
        print(f"Password: {user['password']}")
    
    print("\n🚀 Go test at: http://localhost:5173/auth")

if __name__ == '__main__':
    pass
