# ~/hnj/backend/final_fix_seed.py
import psycopg2
from psycopg2 import sql
import sys
import os

def final_fix_seed():
    """Final fix for database and seed categories"""
    print("=" * 60)
    print("FINAL FIX & SEED SCRIPT")
    print("=" * 60)
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            dbname="hnj_store",
            user="hnj_user",
            password="hnj_password",
            host="localhost",
            port="5432"
        )
        conn.autocommit = False
        cursor = conn.cursor()
        
        print("✓ Connected to PostgreSQL")
        
        # ============ STEP 1: FIX PRODUCTS TABLE ============
        print("\n🔧 Step 1: Fixing products table...")
        
        # First, check if we need to update existing product category_ids
        cursor.execute("SELECT COUNT(*) FROM products WHERE category_id IS NOT NULL")
        product_count = cursor.fetchone()[0]
        print(f"  Found {product_count} products with category_id")
        
        # Create a General category first
        cursor.execute("""
            INSERT INTO product_categories (code, name, description, sort_order, is_active)
            VALUES ('GEN', 'General', 'Default category for existing products', 0, TRUE)
            ON CONFLICT (code) DO NOTHING
            RETURNING id;
        """)
        
        result = cursor.fetchone()
        if result:
            general_cat_id = result[0]
            print(f"  ✓ General category ID: {general_cat_id}")
        else:
            # Get existing General category
            cursor.execute("SELECT id FROM product_categories WHERE code = 'GEN'")
            general_cat_id = cursor.fetchone()[0]
            print(f"  ✓ Found existing General category ID: {general_cat_id}")
        
        # Update all products to use the General category
        cursor.execute("""
            UPDATE products 
            SET category_id = %s
            WHERE category_id IS NOT NULL
        """, (general_cat_id,))
        
        updated_count = cursor.rowcount
        print(f"  ✓ Updated {updated_count} products to use category 'GEN'")
        
        conn.commit()
        
        # ============ STEP 2: ADD MISSING FOREIGN KEY ============
        print("\n🔗 Step 2: Adding foreign key constraint...")
        
        try:
            # Add foreign key from products to product_categories
            cursor.execute("""
                ALTER TABLE products 
                ADD CONSTRAINT fk_products_category 
                FOREIGN KEY (category_id) 
                REFERENCES product_categories(id);
            """)
            conn.commit()
            print("  ✓ Added foreign key: products.category_id → product_categories.id")
        except Exception as e:
            print(f"  ⚠️  Could not add constraint (may already exist): {str(e)[:100]}")
            conn.rollback()
        
        # ============ STEP 3: SEED COMPLETE CATEGORIES ============
        print("\n📁 Step 3: Seeding complete category system...")
        
        # Clear existing categories (except General)
        cursor.execute("DELETE FROM product_subcategories")
        cursor.execute("DELETE FROM product_categories WHERE code != 'GEN'")
        conn.commit()
        print("  ✓ Cleared old categories (kept 'GEN')")
        
        # Seed comprehensive categories
        categories_data = [
            ('KIT', 'Kitchen & Dining Ware', 'All items used for food preparation, cooking, serving, and eating', 1),
            ('FBS', 'Food & Beverage Storage', 'Portable and thermal storage for consumables', 2),
            ('TPA', 'Travel & Personal Accessories', 'Non-apparel items carried for daily convenience', 3),
            ('TOY', 'Toys & Games', 'Items for play and entertainment', 4),
            ('HOU', 'Home Organization & Utility', 'Items to manage clutter and household tasks', 5),
            ('CLS', 'Cleaning & Laundry Supplies', 'Consumables and tools for cleaning', 6),
            ('SGI', 'Stationery & Gift Items', 'Paper goods, writing instruments, and gifts', 7),
            ('PCW', 'Personal Care & Wellness', 'Non-electronic items for health and grooming', 8),
            ('SOC', 'Seasonal & Occasional', 'Items tied to specific times of year or events', 9),
            ('PET', 'Pet Supplies', 'Supplies for common household pets', 10)
        ]
        
        category_ids = {}
        
        for code, name, description, sort_order in categories_data:
            cursor.execute("""
                INSERT INTO product_categories (code, name, description, sort_order, is_active)
                VALUES (%s, %s, %s, %s, TRUE)
                RETURNING id;
            """, (code, name, description, sort_order))
            
            cat_id = cursor.fetchone()[0]
            category_ids[code] = cat_id
            print(f"  ✓ Created category: {code} - {name}")
        
        conn.commit()
        
        # ============ STEP 4: SEED SUBCATEGORIES ============
        print("\n📦 Step 4: Seeding subcategories...")
        
        subcategories = [
            # KIT - Kitchen & Dining Ware
            ('KIT', '01', 'Cookware', 'Pots, pans, and cooking utensils', 1),
            ('KIT', '02', 'Bakeware', 'Baking trays, molds, and sheets', 2),
            ('KIT', '03', 'Food Storage', 'Containers, lunch boxes, wraps', 3),
            ('KIT', '04', 'Utensils', 'Spatulas, ladles, serving spoons', 4),
            ('KIT', '05', 'Serving Dishes', 'Platters, bowls, trays', 5),
            
            # FBS - Food & Beverage Storage
            ('FBS', '01', 'Water Bottles', 'Reusable water bottles', 1),
            ('FBS', '02', 'Vacuum Flasks', 'Thermoses and insulated flasks', 2),
            ('FBS', '03', 'Lunch Boxes', 'Food containers and lunch kits', 3),
            ('FBS', '04', 'Ice Packs', 'Cooling packs and ice boxes', 4),
            ('FBS', '05', 'Jar Sets', 'Storage jars and containers', 5),
            
            # TPA - Travel & Personal Accessories
            ('TPA', '01', 'Umbrellas', 'Rain umbrellas and parasols', 1),
            ('TPA', '02', 'Key Chains', 'Keyrings and key holders', 2),
            ('TPA', '03', 'Wallets & Purses', 'Small wallets and coin purses', 3),
            ('TPA', '04', 'Travel Bottles', 'Toiletry travel containers', 4),
            ('TPA', '05', 'Luggage Tags', 'Bag tags and luggage labels', 5),
        ]
        
        for cat_code, sub_code, name, description, sort_order in subcategories:
            if cat_code in category_ids:
                cursor.execute("""
                    INSERT INTO product_subcategories 
                    (category_id, code, name, description, sort_order, is_active)
                    VALUES (%s, %s, %s, %s, %s, TRUE);
                """, (category_ids[cat_code], sub_code, name, description, sort_order))
                print(f"  → Created: {cat_code}.{sub_code} - {name}")
        
        conn.commit()
        
        # ============ STEP 5: VERIFY ============
        print("\n✅ Step 5: Verification...")
        
        # Count results
        cursor.execute("SELECT COUNT(*) FROM product_categories")
        cat_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM product_subcategories")
        sub_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products")
        prod_count = cursor.fetchone()[0]
        
        print(f"\n📊 DATABASE SUMMARY:")
        print(f"   Product Categories: {cat_count}")
        print(f"   Product Subcategories: {sub_count}")
        print(f"   Total Products: {prod_count}")
        
        print("\n📋 CATEGORY HIERARCHY:")
        cursor.execute("""
            SELECT c.code, c.name, s.code, s.name
            FROM product_categories c
            LEFT JOIN product_subcategories s ON c.id = s.category_id
            ORDER BY c.sort_order, s.sort_order
        """)
        
        current_cat = None
        for cat_code, cat_name, sub_code, sub_name in cursor.fetchall():
            if cat_code != current_cat:
                print(f"\n  {cat_code} - {cat_name}")
                current_cat = cat_code
            if sub_code:
                print(f"    ├── {sub_code} - {sub_name}")
        
        print("\n" + "=" * 60)
        print("✅ FIX & SEED COMPLETE!")
        print("=" * 60)
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    final_fix_seed()