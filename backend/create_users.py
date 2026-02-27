from app import create_app, db
from models import User

app = create_app()
with app.app_context():
    # Clear existing users (optional - remove if you want to keep existing)
    # User.query.delete()
    
    users_data = [
        ('admin1', 'admin@hnj.com', 'Admin User', 'admin', 'admin123'),
        ('runner1', 'runner@hnj.com', 'Errand Runner', 'errand', 'runner123'),
        ('receiver1', 'receiver@hnj.com', 'Batch Receiver', 'receiver', 'receiver123'),
        ('senior1', 'senior@hnj.com', 'Senior Staff', 'senior', 'senior123')
    ]
    
    for username, email, full_name, role, password in users_data:
        # Check if user exists
        existing = User.query.filter_by(username=username).first()
        if not existing:
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                role=role,
                is_active=True
            )
            user.set_password(password)
            db.session.add(user)
            print(f"✅ Created {role}: {username}")
        else:
            print(f"⚠️ {username} already exists")
    
    db.session.commit()
    print("\n📋 Current users:")
    for u in User.query.all():
        print(f"  - {u.username} ({u.role})")
