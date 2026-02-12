#!/usr/bin/env python3
"""
Backend API Testing for Clinic Settings Module
Testing external API: https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

class ClinicAPITester:
    def __init__(self):
        self.base_url = "https://given-dolly-ayurparishkarkendra-e5891817.koyeb.app"
        self.supabase_url = "https://evkcvntjpkxlcxgwychq.supabase.co"
        self.supabase_anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2a2N2bnRqcGt4bGN4Z3d5Y2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5ODc5MTgsImV4cCI6MjA4NDU2MzkxOH0.IQ4_E40tERwPYQQf1Pt6ZmSJP0Pevz_mEa1U-ZcwF2I"
        self.access_token = None
        self.tenant_id = None
        self.test_results = []
        
    def log_result(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def authenticate_supabase(self, email: str, password: str) -> bool:
        """Authenticate with Supabase and get access token"""
        try:
            auth_url = f"{self.supabase_url}/auth/v1/token?grant_type=password"
            headers = {
                "apikey": self.supabase_anon_key,
                "Content-Type": "application/json"
            }
            data = {
                "email": email,
                "password": password
            }
            
            response = requests.post(auth_url, headers=headers, json=data)
            
            if response.status_code == 200:
                auth_data = response.json()
                self.access_token = auth_data.get("access_token")
                self.log_result("Supabase Authentication", True, "Successfully authenticated")
                return True
            else:
                self.log_result("Supabase Authentication", False, f"Auth failed: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Supabase Authentication", False, f"Auth error: {str(e)}")
            return False
    
    def get_user_context(self) -> bool:
        """Get user context and tenant_id"""
        try:
            if not self.access_token:
                self.log_result("Get User Context", False, "No access token available")
                return False
                
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.get(f"{self.base_url}/api/v1/auth/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                self.tenant_id = user_data.get("tenant_id") or user_data.get("tenantId")
                if self.tenant_id:
                    self.log_result("Get User Context", True, f"Got tenant_id: {self.tenant_id}")
                    return True
                else:
                    self.log_result("Get User Context", False, "No tenant_id in user context", user_data)
                    return False
            else:
                self.log_result("Get User Context", False, f"Failed to get user context: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Get User Context", False, f"Error getting user context: {str(e)}")
            return False
    
    def make_api_request(self, method: str, endpoint: str, data: Dict = None) -> requests.Response:
        """Make authenticated API request"""
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}{endpoint}"
        
        if method.upper() == "GET":
            return requests.get(url, headers=headers)
        elif method.upper() == "POST":
            return requests.post(url, headers=headers, json=data)
        elif method.upper() == "PATCH":
            return requests.patch(url, headers=headers, json=data)
        elif method.upper() == "DELETE":
            return requests.delete(url, headers=headers)
    
    def test_operating_hours_crud(self):
        """Test Operating Hours CRUD operations"""
        if not self.tenant_id:
            self.log_result("Operating Hours CRUD", False, "No tenant_id available")
            return
            
        base_path = f"/api/v1/clinic/{self.tenant_id}/operating-hours"
        
        # Test 1: List Operating Hours
        try:
            response = self.make_api_request("GET", f"{base_path}?limit=10")
            if response.status_code == 200:
                data = response.json()
                if "items" in data or isinstance(data, list):
                    self.log_result("List Operating Hours", True, "Successfully retrieved operating hours list")
                else:
                    self.log_result("List Operating Hours", False, "Response missing 'items' array", data)
            else:
                self.log_result("List Operating Hours", False, f"Failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("List Operating Hours", False, f"Error: {str(e)}")
        
        # Test 2: Create Operating Hours
        create_data = {
            "day_of_week": 0,
            "is_open": True,
            "open_time": "09:00:00",
            "close_time": "18:00:00",
            "break_start": "13:00:00",
            "break_end": "14:00:00",
            "status": "active"
        }
        
        created_id = None
        try:
            response = self.make_api_request("POST", base_path, create_data)
            if response.status_code in [200, 201]:
                created_record = response.json()
                created_id = created_record.get("id")
                self.log_result("Create Operating Hours", True, "Successfully created operating hours")
            else:
                self.log_result("Create Operating Hours", False, f"Failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Create Operating Hours", False, f"Error: {str(e)}")
        
        # Test 3: Validation - End time before start time
        invalid_data = {
            "day_of_week": 1,
            "is_open": True,
            "open_time": "18:00:00",
            "close_time": "09:00:00"
        }
        
        try:
            response = self.make_api_request("POST", base_path, invalid_data)
            if response.status_code >= 400:
                self.log_result("Operating Hours Validation", True, "Properly rejected invalid time range")
            else:
                self.log_result("Operating Hours Validation", False, "Should reject invalid time range", response.json())
        except Exception as e:
            self.log_result("Operating Hours Validation", False, f"Error: {str(e)}")
        
        # Test 4: Delete Operating Hours
        if created_id:
            try:
                response = self.make_api_request("DELETE", f"{base_path}/{created_id}")
                if response.status_code in [200, 204]:
                    self.log_result("Delete Operating Hours", True, "Successfully deleted operating hours")
                else:
                    self.log_result("Delete Operating Hours", False, f"Failed: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Delete Operating Hours", False, f"Error: {str(e)}")
    
    def test_rooms_crud(self):
        """Test Rooms CRUD operations"""
        if not self.tenant_id:
            self.log_result("Rooms CRUD", False, "No tenant_id available")
            return
            
        base_path = f"/api/v1/clinic/{self.tenant_id}/rooms"
        
        # Test 1: List Rooms
        try:
            response = self.make_api_request("GET", f"{base_path}?limit=50")
            if response.status_code == 200:
                data = response.json()
                if "items" in data or isinstance(data, list):
                    self.log_result("List Rooms", True, "Successfully retrieved rooms list")
                else:
                    self.log_result("List Rooms", False, "Response missing 'items' array", data)
            else:
                self.log_result("List Rooms", False, f"Failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("List Rooms", False, f"Error: {str(e)}")
        
        # Test 2: Create Room
        create_data = {
            "name": "Test Therapy Room",
            "capacity": 2,
            "room_type": "therapy"
        }
        
        created_room_id = None
        try:
            response = self.make_api_request("POST", base_path, create_data)
            if response.status_code in [200, 201]:
                created_room = response.json()
                created_room_id = created_room.get("id")
                self.log_result("Create Room", True, "Successfully created room")
            else:
                self.log_result("Create Room", False, f"Failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Create Room", False, f"Error: {str(e)}")
        
        # Test 3: Update Room
        if created_room_id:
            update_data = {
                "name": "Updated Therapy Room",
                "is_active": True
            }
            
            try:
                response = self.make_api_request("PATCH", f"{base_path}/{created_room_id}", update_data)
                if response.status_code == 200:
                    self.log_result("Update Room", True, "Successfully updated room")
                else:
                    self.log_result("Update Room", False, f"Failed: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Update Room", False, f"Error: {str(e)}")
        
        # Test 4: Delete Room
        if created_room_id:
            try:
                response = self.make_api_request("DELETE", f"{base_path}/{created_room_id}")
                if response.status_code in [200, 204]:
                    self.log_result("Delete Room", True, "Successfully deleted room")
                else:
                    self.log_result("Delete Room", False, f"Failed: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Delete Room", False, f"Error: {str(e)}")
    
    def test_treatments_crud(self):
        """Test Treatments CRUD operations"""
        if not self.tenant_id:
            self.log_result("Treatments CRUD", False, "No tenant_id available")
            return
            
        base_path = f"/api/v1/clinic/{self.tenant_id}/treatments"
        
        # Test 1: List Treatments
        try:
            response = self.make_api_request("GET", f"{base_path}?limit=100")
            if response.status_code == 200:
                data = response.json()
                if "items" in data or isinstance(data, list):
                    self.log_result("List Treatments", True, "Successfully retrieved treatments list")
                else:
                    self.log_result("List Treatments", False, "Response missing 'items' array", data)
            else:
                self.log_result("List Treatments", False, f"Failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("List Treatments", False, f"Error: {str(e)}")
        
        # Test 2: Create Treatment
        create_data = {
            "code": "TEST001",
            "name": "Test Abhyanga",
            "description": "Test treatment",
            "duration_minutes": 60,
            "base_price": "1500.00",
            "dosha_benefits": {
                "vata": {
                    "balances": True,
                    "notes": "Calms vata"
                }
            },
            "contraindications": "Fever, acute inflammation"
        }
        
        created_treatment_id = None
        try:
            response = self.make_api_request("POST", base_path, create_data)
            if response.status_code in [200, 201]:
                created_treatment = response.json()
                created_treatment_id = created_treatment.get("id")
                self.log_result("Create Treatment", True, "Successfully created treatment")
            else:
                self.log_result("Create Treatment", False, f"Failed: {response.status_code}", response.text)
        except Exception as e:
            self.log_result("Create Treatment", False, f"Error: {str(e)}")
        
        # Test 3: Update Treatment
        if created_treatment_id:
            update_data = {
                "name": "Updated Abhyanga",
                "price": "1800.00"
            }
            
            try:
                response = self.make_api_request("PATCH", f"{base_path}/{created_treatment_id}", update_data)
                if response.status_code == 200:
                    self.log_result("Update Treatment", True, "Successfully updated treatment")
                else:
                    self.log_result("Update Treatment", False, f"Failed: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Update Treatment", False, f"Error: {str(e)}")
        
        # Test 4: Delete Treatment
        if created_treatment_id:
            try:
                response = self.make_api_request("DELETE", f"{base_path}/{created_treatment_id}")
                if response.status_code in [200, 204]:
                    self.log_result("Delete Treatment", True, "Successfully deleted treatment")
                else:
                    self.log_result("Delete Treatment", False, f"Failed: {response.status_code}", response.text)
            except Exception as e:
                self.log_result("Delete Treatment", False, f"Error: {str(e)}")
    
    def test_tenant_scoping(self):
        """Test tenant scoping by trying to access with invalid tenant_id"""
        if not self.tenant_id:
            self.log_result("Tenant Scoping", False, "No tenant_id available")
            return
        
        # Try accessing with a fake tenant_id
        fake_tenant_id = "00000000-0000-0000-0000-000000000000"
        fake_path = f"/api/v1/clinic/{fake_tenant_id}/rooms?limit=10"
        
        try:
            response = self.make_api_request("GET", fake_path)
            if response.status_code in [403, 404] or (response.status_code == 200 and not response.json().get("items")):
                self.log_result("Tenant Scoping", True, "Properly scoped to tenant - fake tenant_id rejected/empty")
            else:
                self.log_result("Tenant Scoping", False, f"Tenant scoping issue: {response.status_code}", response.json())
        except Exception as e:
            self.log_result("Tenant Scoping", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("🧪 Starting Clinic Settings API Tests")
        print("=" * 50)
        
        # Step 1: Authentication
        if not self.authenticate_supabase("hareshlekkala@gmail.com", "Vishnu432!"):
            print("❌ Authentication failed - cannot proceed with tests")
            return False
        
        # Step 2: Get user context and tenant_id
        if not self.get_user_context():
            print("❌ Failed to get user context - cannot proceed with tests")
            return False
        
        # Step 3: Run CRUD tests
        print("\n📋 Testing Operating Hours CRUD...")
        self.test_operating_hours_crud()
        
        print("\n🏠 Testing Rooms CRUD...")
        self.test_rooms_crud()
        
        print("\n💊 Testing Treatments CRUD...")
        self.test_treatments_crud()
        
        print("\n🔒 Testing Tenant Scoping...")
        self.test_tenant_scoping()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = ClinicAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)