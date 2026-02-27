# app.py - COMPLETE WORKING VERSION
from dotenv import load_dotenv
load_dotenv()
import os
from datetime import timedelta
from flask import Flask, send_from_directory, jsonify
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt

# Initialize extensions
db = SQLAlchemy()
mail = Mail()
socketio = SocketIO()
bcrypt = Bcrypt()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Session configuration for cart
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-session-secret-key-change-this')
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://hnj_user:hnj_password@localhost/hnj_store')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-super-secret-jwt-key-change-this')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    
    # Bcrypt configuration
    app.config['BCRYPT_LOG_ROUNDS'] = int(os.getenv('BCRYPT_LOG_ROUNDS', 12))
    
    # CORS configuration - Allow ngrok domains
    CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "https://*.ngrok-free.dev",  # Allow all ngrok-free.dev subdomains
    "https://supervital-unstoried-trace.ngrok-free.dev"  # Your specific ngrok URL
])

    # Mail configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USE_SSL'] = False
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = 'hnj.store@gmail.com'
    
    # File upload configuration
    UPLOAD_FOLDER = os.path.join('static', 'uploads', 'products')
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
    
    # Initialize extensions with app
    db.init_app(app)
    mail.init_app(app)
    migrate = Migrate(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # Import models after db is initialized
    from models import TokenBlocklist
    
    # Check if token is blacklisted
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        token = TokenBlocklist.query.filter_by(jti=jti).first()
        return token is not None
    
    # Import and register ALL blueprints
    from views.auth_routes import auth_bp
    from views.cart_routes import cart_bp
    from views.wishlist_routes import wishlist_bp
    from views.product_routes import product_bp
    from views.order_routes import order_bp
    from views.payment_routes import payment_bp
    from views.staff_routes import staff_bp
    from views.mpesa_routes import mpesa_bp
    from views.receiving_routes import receiving_bp
    from views.errand_routes import errand_bp
    
    # Register blueprints with appropriate prefixes
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(cart_bp, url_prefix="/api")
    app.register_blueprint(wishlist_bp, url_prefix="/api")
    app.register_blueprint(product_bp, url_prefix="/api/products")
    app.register_blueprint(order_bp, url_prefix="/api/orders")
    app.register_blueprint(payment_bp, url_prefix="/api/payments")
    app.register_blueprint(staff_bp, url_prefix="/api/staff")
    app.register_blueprint(mpesa_bp, url_prefix="/api/mpesa")
    app.register_blueprint(receiving_bp, url_prefix="/api")
    app.register_blueprint(errand_bp, url_prefix='/api')
    
    # Health check endpoint
    @app.route("/api/health")
    def health_check():
        return {"status": "healthy", "service": "hnj", "version": "1.0"}
    
    # Debug endpoints
    @app.route("/api/debug/routes")
    def debug_routes():
        routes = []
        for rule in app.url_map.iter_rules():
            routes.append({
                'endpoint': rule.endpoint,
                'methods': list(rule.methods),
                'path': str(rule)
            })
        return jsonify({'routes': sorted(routes, key=lambda x: x['path'])})
    
    @app.route('/')
    def home():
        return {
            "message": "HNJ E-commerce + POS Backend API",
            "version": "1.0",
            "endpoints": {
                "auth": "/api/auth",
                "products": "/api/products",
                "cart": "/api/cart",
                "wishlist": "/api/wishlist",
                "orders": "/api/orders",
                "payments": "/api/payments",
                "staff": "/api/staff",
                "receiving": "/api/receiving",
                "inventory": "/api/inventory"
            }
        }
    
    # ============ SOCKETIO WORKAROUND: Serve files through API routes ============
    @app.route('/api/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        """Serve uploaded files explicitly - SocketIO safe"""
        try:
            # Check if filename includes 'products' folder
            if 'products/' in filename:
                # Extract just the filename
                parts = filename.split('products/')
                if len(parts) > 1:
                    actual_filename = parts[1]
                    uploads_dir = os.path.join('static', 'uploads', 'products')
                    return send_from_directory(uploads_dir, actual_filename)
            
            # Default to general uploads
            uploads_dir = os.path.join('static', 'uploads')
            return send_from_directory(uploads_dir, filename)
            
        except Exception as e:
            print(f"Error serving file {filename}: {str(e)}")
            return jsonify({'error': 'File not found'}), 404

    @app.route('/api/static/<path:filename>')
    def serve_all_static(filename):
        """Serve all static files through API"""
        return send_from_directory('static', filename)
    
    # ============ Initialize SocketIO AFTER these API routes ============
    socketio.init_app(app, 
                  cors_allowed_origins=[
                      "http://localhost:5173", 
                      "http://127.0.0.1:5173",
                      "https://*.ngrok-free.dev",
                      "https://supervital-unstoried-trace.ngrok-free.dev"
                  ], 
                  async_mode='eventlet')
    
    # Create database tables on startup
    with app.app_context():
        db.create_all()
        print("=" * 60)
        print("DATABASE TABLES CREATED SUCCESSFULLY!")
        print("=" * 60)
        
        # Check if we have any products
        from models import Product
        product_count = Product.query.count()
        print(f"Products in database: {product_count}")
        
        if product_count == 0:
            print("No products found. You can create some via the admin panel.")
    
    return app

app = create_app()

if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)