# ~/hnj/backend/utils/barcode_utils.py
import barcode
from barcode.writer import ImageWriter
import qrcode
from io import BytesIO
import base64
import uuid
from datetime import datetime
import os

class BarcodeGenerator:
    """Professional barcode generator with classification encoding"""
    
    # Barcode formats by product type/value
    FORMATS = {
        'standard': 'code128',    # Regular products
        'high_value': 'code39',   # High-value items
        'small': 'ean13',         # Small items, retail
        'qr': 'qr'               # Digital items, info-rich
    }
    
    @staticmethod
    def generate_sku(category_code, subcategory_code, brand_code=None, product_code=None):
        """Generate intelligent SKU with classification"""
        
        # Category (3 chars) + Subcategory (2 chars) + Brand (3 chars) + Sequence (4 chars)
        if not product_code:
            product_code = str(uuid.uuid4().int)[:4]
        
        if brand_code:
            sku = f"{category_code}-{subcategory_code}-{brand_code}-{product_code}"
        else:
            sku = f"{category_code}-{subcategory_code}-{product_code}"
        
        return sku.upper()
    
    @staticmethod
    def generate_barcode_number(product):
        """Generate unique barcode number with embedded classification"""
        
        # Format: [CAT][SUBCAT][YEAR][MONTH][SEQUENCE][CHECKSUM]
        
        category_code = product.category.code if product.category else 'GEN'
        subcat_code = product.subcategory.code if product.subcategory else '00'
        
        year = datetime.now().strftime('%y')
        month = datetime.now().strftime('%m')
        
        # Generate unique sequence (last 4 digits of product ID or random)
        sequence = str(product.id).zfill(4)[-4:] if product.id else str(uuid.uuid4().int)[:4]
        
        # Create base barcode
        base = f"{category_code}{subcat_code}{year}{month}{sequence}"
        
        # Add Luhn checksum for validation
        checksum = BarcodeGenerator._calculate_checksum(base)
        
        return f"{base}{checksum}"
    
    @staticmethod
    def _calculate_checksum(code):
        """Calculate Luhn checksum for barcode validation"""
        total = 0
        for i, char in enumerate(code):
            num = ord(char) % 10  # Simple checksum
            if i % 2 == 0:
                num *= 2
                if num > 9:
                    num -= 9
            total += num
        return str((10 - (total % 10)) % 10)
    
    @staticmethod
    def generate_barcode_image(barcode_text, format='code128'):
        """Generate scannable barcode image"""
        try:
            # Choose barcode class
            if format == 'code128':
                barcode_class = barcode.get_barcode_class('code128')
            elif format == 'code39':
                barcode_class = barcode.get_barcode_class('code39')
            elif format == 'ean13':
                barcode_class = barcode.get_barcode_class('ean13')
            else:
                barcode_class = barcode.get_barcode_class('code128')
            
            # Generate barcode
            barcode_obj = barcode_class(barcode_text, writer=ImageWriter())
            
            # Save to bytes
            buffer = BytesIO()
            barcode_obj.write(buffer, options={
                'module_width': 0.2,
                'module_height': 15,
                'quiet_zone': 5,
                'font_size': 10,
                'text_distance': 5,
                'background': 'white',
                'foreground': 'black'
            })
            
            buffer.seek(0)
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
            
        except Exception as e:
            print(f"Error generating barcode: {e}")
            return None
    
    @staticmethod
    def generate_qr_code(product):
        """Generate QR code with rich product information"""
        qr_data = {
            'sku': product.sku,
            'name': product.name,
            'category': product.category.name if product.category else 'General',
            'subcategory': product.subcategory.name if product.subcategory else None,
            'price': float(product.selling_price) if product.selling_price else None,
            'barcode': product.barcode,
            'brand': product.brand,
            'model': product.model,
            'stock': product.stock_quantity,
            'reorder_level': product.min_stock_level
        }
        
        import json
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    @staticmethod
    def decode_barcode(barcode_text):
        """Extract classification from barcode"""
        try:
            # Expected format: KIT01-2412-0001-7
            # Category: KIT (3 chars)
            # Subcategory: 01 (2 chars)
            # Date: 2412 (YYMM)
            # Sequence: 0001 (4 chars)
            # Checksum: 7 (1 char)
            
            category = barcode_text[:3]
            subcategory = barcode_text[3:5]
            date = barcode_text[5:9]
            sequence = barcode_text[9:13]
            checksum = barcode_text[13]
            
            return {
                'category_code': category,
                'subcategory_code': subcategory,
                'date': date,
                'sequence': sequence,
                'checksum': checksum,
                'valid': BarcodeGenerator._verify_checksum(barcode_text)
            }
        except:
            return None
    
    @staticmethod
    def _verify_checksum(barcode):
        """Verify barcode checksum"""
        if len(barcode) < 2:
            return False
        code = barcode[:-1]
        provided_checksum = barcode[-1]
        calculated = BarcodeGenerator._calculate_checksum(code)
        return provided_checksum == calculated

# Export functions for easy import
generate_sku = BarcodeGenerator.generate_sku
generate_barcode_number = BarcodeGenerator.generate_barcode_number
generate_barcode_image = BarcodeGenerator.generate_barcode_image
generate_qr_code = BarcodeGenerator.generate_qr_code
decode_barcode = BarcodeGenerator.decode_barcode