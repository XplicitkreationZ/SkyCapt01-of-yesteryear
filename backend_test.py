import requests
import sys
import json
from datetime import datetime

class ECommerceAPITester:
    def __init__(self, base_url="https://xplicit-dispatch.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json() if success else response.text}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_seed_products(self):
        """Test /api/seed endpoint - creates sample products once"""
        try:
            response = requests.post(f"{self.api_url}/seed", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Should either insert products or skip if already exists
                if "inserted" in data:
                    details = f"Inserted {data['inserted']} products"
                elif "skipped" in data and data["skipped"]:
                    details = f"Skipped seeding, {data['count']} products already exist"
                else:
                    details = "Unexpected response format"
                    success = False
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Seed Products", success, details)
            return success
        except Exception as e:
            self.log_test("Seed Products", False, f"Error: {str(e)}")
            return False

    def test_get_products(self):
        """Test /api/products endpoint - returns list of products"""
        try:
            response = requests.get(f"{self.api_url}/products", timeout=10)
            success = response.status_code == 200
            
            if success:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    # Check product structure
                    product = products[0]
                    required_fields = ["id", "name", "price", "description"]
                    missing_fields = [field for field in required_fields if field not in product]
                    
                    if missing_fields:
                        success = False
                        details = f"Missing required fields: {missing_fields}"
                    else:
                        details = f"Found {len(products)} products with correct structure"
                else:
                    success = False
                    details = "No products returned or invalid format"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Products List", success, details)
            return success, products if success else []
        except Exception as e:
            self.log_test("Get Products List", False, f"Error: {str(e)}")
            return False, []

    def test_get_single_product(self, product_id):
        """Test /api/products/{id} endpoint - returns single product"""
        try:
            response = requests.get(f"{self.api_url}/products/{product_id}", timeout=10)
            success = response.status_code == 200
            
            if success:
                product = response.json()
                required_fields = ["id", "name", "price", "description"]
                missing_fields = [field for field in required_fields if field not in product]
                
                if missing_fields:
                    success = False
                    details = f"Missing required fields: {missing_fields}"
                elif product["id"] != product_id:
                    success = False
                    details = f"Product ID mismatch: expected {product_id}, got {product['id']}"
                else:
                    details = f"Product retrieved: {product['name']} - ${product['price']}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Single Product", success, details)
            return success
        except Exception as e:
            self.log_test("Get Single Product", False, f"Error: {str(e)}")
            return False

    def test_create_order(self, product_ids):
        """Test /api/orders endpoint - mock checkout"""
        try:
            # Create order with sample items
            items = [{"product_id": pid, "quantity": 1} for pid in product_ids[:2]]  # Use first 2 products
            
            response = requests.post(
                f"{self.api_url}/orders", 
                json=items,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                order = response.json()
                required_fields = ["id", "items", "subtotal", "tax", "total", "status"]
                missing_fields = [field for field in required_fields if field not in order]
                
                if missing_fields:
                    success = False
                    details = f"Missing required fields: {missing_fields}"
                elif order["status"] != "mock_confirmed":
                    success = False
                    details = f"Expected status 'mock_confirmed', got '{order['status']}'"
                elif order["tax"] != 0.0:
                    success = False
                    details = f"Expected tax 0.0 (mocked), got {order['tax']}"
                else:
                    details = f"Order created: ID {order['id']}, Total ${order['total']}, Status: {order['status']}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Create Order (Mock Checkout)", success, details)
            return success
        except Exception as e:
            self.log_test("Create Order (Mock Checkout)", False, f"Error: {str(e)}")
            return False

    def test_invalid_product_order(self):
        """Test order creation with invalid product ID"""
        try:
            items = [{"product_id": "invalid-id", "quantity": 1}]
            
            response = requests.post(
                f"{self.api_url}/orders", 
                json=items,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            success = response.status_code == 400  # Should return 400 for invalid product
            
            if success:
                details = "Correctly rejected invalid product ID"
            else:
                details = f"Expected 400 status, got {response.status_code}"
            
            self.log_test("Invalid Product Order Handling", success, details)
            return success
        except Exception as e:
            self.log_test("Invalid Product Order Handling", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting E-commerce API Tests")
        print(f"Testing against: {self.api_url}")
        print("=" * 50)
        
        # Test 1: API Health
        if not self.test_api_health():
            print("❌ API is not accessible, stopping tests")
            return self.generate_report()
        
        # Test 2: Seed products
        self.test_seed_products()
        
        # Test 3: Get products list
        products_success, products = self.test_get_products()
        
        if products_success and products:
            # Test 4: Get single product
            self.test_get_single_product(products[0]["id"])
            
            # Test 5: Create order with valid products
            product_ids = [p["id"] for p in products]
            self.test_create_order(product_ids)
        
        # Test 6: Invalid product order
        self.test_invalid_product_order()
        
        return self.generate_report()

    def generate_report(self):
        """Generate final test report"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            failed_tests = [r for r in self.test_results if not r["success"]]
            print("\nFailed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
            return 1

def main():
    tester = ECommerceAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())