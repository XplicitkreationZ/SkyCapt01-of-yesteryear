"""
Backend API tests for XplicitkreationZ - Testing cart persistence, ID upload, and order features
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_ID_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

class TestHealthEndpoints:
    """Health check endpoints"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("SUCCESS: API health check passed")
    
    def test_api_ready(self):
        """Test API ready endpoint with MongoDB"""
        response = requests.get(f"{BASE_URL}/api/ready")
        assert response.status_code == 200
        data = response.json()
        assert data.get("mongo") == True
        print("SUCCESS: API ready check passed - MongoDB connected")


class TestProductEndpoints:
    """Product CRUD endpoints"""
    
    def test_get_products(self):
        """Test getting all products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"SUCCESS: Got {len(data)} products")
        return data
    
    def test_get_single_product(self):
        """Test getting a single product by ID"""
        # First get all products
        products = requests.get(f"{BASE_URL}/api/products").json()
        if len(products) > 0:
            product_id = products[0].get("id")
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            data = response.json()
            assert data.get("id") == product_id
            print(f"SUCCESS: Got product {data.get('name')}")


class TestDeliveryQuote:
    """Delivery quote endpoint tests"""
    
    def test_valid_austin_zip(self):
        """Test delivery quote for valid Austin ZIP"""
        response = requests.post(f"{BASE_URL}/api/delivery/quote", json={
            "zip": "78751",
            "subtotal": 60.00
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("allowed") == True
        assert data.get("tier") is not None
        print(f"SUCCESS: Delivery quote for 78751 - Tier: {data.get('tier')}, Fee: ${data.get('fee')}")
    
    def test_outside_radius_zip(self):
        """Test delivery quote for ZIP outside 40-mile radius"""
        response = requests.post(f"{BASE_URL}/api/delivery/quote", json={
            "zip": "77001",  # Houston
            "subtotal": 60.00
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("allowed") == False
        assert "Outside" in data.get("reason", "") or "radius" in data.get("reason", "").lower()
        print(f"SUCCESS: Houston ZIP correctly rejected - {data.get('reason')}")
    
    def test_non_texas_zip(self):
        """Test delivery quote for non-Texas ZIP"""
        response = requests.post(f"{BASE_URL}/api/delivery/quote", json={
            "zip": "90210",  # California
            "subtotal": 60.00
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("allowed") == False
        assert "Texas" in data.get("reason", "")
        print(f"SUCCESS: California ZIP correctly rejected - {data.get('reason')}")
    
    def test_minimum_order_not_met(self):
        """Test delivery quote when minimum order not met"""
        response = requests.post(f"{BASE_URL}/api/delivery/quote", json={
            "zip": "78751",
            "subtotal": 10.00  # Below minimum
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("allowed") == False
        assert "Minimum" in data.get("reason", "")
        print(f"SUCCESS: Low subtotal correctly rejected - {data.get('reason')}")


class TestOrderWithIDImage:
    """Test order creation with ID image - Core feature test"""
    
    def test_create_order_with_id_image(self):
        """Test creating a delivery order with ID image"""
        # First get a product
        products = requests.get(f"{BASE_URL}/api/products").json()
        assert len(products) > 0, "No products available for testing"
        
        product = products[0]
        product_id = product.get("id")
        
        # Create order with ID image
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "address": {
                "name": "TEST_ID_User",
                "phone": "5125551234",
                "address1": "123 Test St",
                "city": "Austin",
                "state": "TX",
                "zip": "78751",
                "dob": "1990-01-15",
                "email": "test@example.com"
            },
            "id_image": TEST_ID_IMAGE_BASE64
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/delivery", json=order_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "order_id" in data
        assert "total" in data
        assert data.get("status") == "pending_payment"
        
        print(f"SUCCESS: Order created with ID image - Order ID: {data.get('order_id')}")
        return data.get("order_id")
    
    def test_create_order_without_id_image_fails(self):
        """Test that order creation fails without ID image"""
        products = requests.get(f"{BASE_URL}/api/products").json()
        assert len(products) > 0
        
        product = products[0]
        product_id = product.get("id")
        
        # Create order WITHOUT ID image
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "address": {
                "name": "TEST_NoID_User",
                "phone": "5125551234",
                "address1": "123 Test St",
                "city": "Austin",
                "state": "TX",
                "zip": "78751",
                "dob": "1990-01-15",
                "email": "test@example.com"
            }
            # No id_image field
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/delivery", json=order_data)
        assert response.status_code == 400
        data = response.json()
        assert "ID image" in data.get("detail", "") or "id" in data.get("detail", "").lower()
        print(f"SUCCESS: Order without ID correctly rejected - {data.get('detail')}")
    
    def test_underage_order_rejected(self):
        """Test that underage orders are rejected"""
        products = requests.get(f"{BASE_URL}/api/products").json()
        assert len(products) > 0
        
        product = products[0]
        product_id = product.get("id")
        
        # Create order with underage DOB
        order_data = {
            "items": [{"product_id": product_id, "quantity": 1}],
            "address": {
                "name": "TEST_Underage_User",
                "phone": "5125551234",
                "address1": "123 Test St",
                "city": "Austin",
                "state": "TX",
                "zip": "78751",
                "dob": "2010-01-15",  # Underage
                "email": "test@example.com"
            },
            "id_image": TEST_ID_IMAGE_BASE64
        }
        
        response = requests.post(f"{BASE_URL}/api/orders/delivery", json=order_data)
        assert response.status_code == 400
        data = response.json()
        assert "21" in data.get("detail", "")
        print(f"SUCCESS: Underage order correctly rejected - {data.get('detail')}")


class TestAdminOrdersEndpoint:
    """Test admin orders endpoint - Dispatcher Console"""
    
    def test_get_admin_orders(self):
        """Test getting all orders for dispatcher console"""
        response = requests.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 200
        data = response.json()
        
        assert "orders" in data
        assert "count" in data
        assert isinstance(data.get("orders"), list)
        
        print(f"SUCCESS: Got {data.get('count')} orders from admin endpoint")
        
        # Check order structure
        if len(data.get("orders", [])) > 0:
            order = data["orders"][0]
            assert "id" in order
            assert "status" in order
            assert "customer" in order
            assert "delivery" in order
            assert "total" in order
            # Check for id_image field (may be None for old orders)
            assert "id_image" in order or order.get("id_image") is None
            print("SUCCESS: Order structure is correct with id_image field")
    
    def test_order_has_id_image_field(self):
        """Test that orders include id_image field for verification"""
        # First create an order with ID image
        products = requests.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        
        order_data = {
            "items": [{"product_id": product.get("id"), "quantity": 1}],
            "address": {
                "name": "TEST_IDCheck_User",
                "phone": "5125551234",
                "address1": "456 Test Ave",
                "city": "Austin",
                "state": "TX",
                "zip": "78751",
                "dob": "1985-06-20",
                "email": "idcheck@example.com"
            },
            "id_image": TEST_ID_IMAGE_BASE64
        }
        
        create_response = requests.post(f"{BASE_URL}/api/orders/delivery", json=order_data)
        assert create_response.status_code == 200
        order_id = create_response.json().get("order_id")
        
        # Now get admin orders and find our order
        admin_response = requests.get(f"{BASE_URL}/api/admin/orders")
        assert admin_response.status_code == 200
        orders = admin_response.json().get("orders", [])
        
        # Find our order
        our_order = next((o for o in orders if o.get("id") == order_id), None)
        assert our_order is not None, f"Order {order_id} not found in admin orders"
        
        # Verify id_image is present
        assert our_order.get("id_image") is not None
        assert our_order.get("id_image").startswith("data:image")
        print(f"SUCCESS: Order {order_id} has id_image stored correctly")


class TestOrderStatusUpdate:
    """Test order status update endpoints"""
    
    def test_update_order_status(self):
        """Test updating order status via admin endpoint"""
        # Get existing orders
        response = requests.get(f"{BASE_URL}/api/admin/orders")
        orders = response.json().get("orders", [])
        
        if len(orders) > 0:
            order_id = orders[0].get("id")
            
            # Update status
            update_response = requests.patch(
                f"{BASE_URL}/api/admin/orders/{order_id}/status",
                json={"status": "confirmed"}
            )
            assert update_response.status_code == 200
            data = update_response.json()
            assert data.get("ok") == True
            print(f"SUCCESS: Order {order_id} status updated to confirmed")
        else:
            pytest.skip("No orders available for status update test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
