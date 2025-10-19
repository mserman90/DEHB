import requests
import sys
import json
from datetime import datetime, date

class StudyFocusAPITester:
    def __init__(self, base_url="https://studyfocus-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_task_id = None
        self.created_achievement_count = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if method == 'GET' and isinstance(response_data, list):
                        print(f"   Response: {len(response_data)} items")
                    elif method == 'GET' and isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            required_fields = ['today_tasks', 'completed_tasks', 'today_pomodoros', 
                             'today_study_minutes', 'today_questions', 'total_achievements', 'current_streak']
            for field in required_fields:
                if field not in response:
                    print(f"   ⚠️  Missing field: {field}")
                    return False
            print(f"   Dashboard data: {response}")
        return success

    def test_task_crud(self):
        """Test task CRUD operations"""
        today = date.today().isoformat()
        
        # Create task
        task_data = {
            "title": "Test Matematik Soruları",
            "subject": "Matematik",
            "description": "Limit ve türev konularını çalış",
            "priority": "high",
            "date": today,
            "duration_minutes": 30
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data=task_data
        )
        
        if not success:
            return False
            
        self.created_task_id = response.get('id')
        print(f"   Created task ID: {self.created_task_id}")
        
        # Get all tasks
        success, response = self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )
        
        if not success:
            return False
            
        # Get tasks by date
        success, response = self.run_test(
            "Get Tasks by Date",
            "GET",
            "tasks",
            200,
            params={"date": today}
        )
        
        if not success:
            return False
            
        # Update task
        if self.created_task_id:
            update_data = {"completed": True}
            success, response = self.run_test(
                "Update Task",
                "PUT",
                f"tasks/{self.created_task_id}",
                200,
                data=update_data
            )
            
            if not success:
                return False
                
        # Delete task
        if self.created_task_id:
            success, response = self.run_test(
                "Delete Task",
                "DELETE",
                f"tasks/{self.created_task_id}",
                200
            )
            
            if not success:
                return False
                
        return True

    def test_pomodoro_sessions(self):
        """Test pomodoro session creation and stats"""
        today = date.today().isoformat()
        
        # Create work session
        session_data = {
            "duration_minutes": 25,
            "session_type": "work",
            "subject": "Matematik",
            "date": today
        }
        
        success, response = self.run_test(
            "Create Pomodoro Session",
            "POST",
            "pomodoro",
            200,
            data=session_data
        )
        
        if not success:
            return False
            
        # Get pomodoro stats
        success, response = self.run_test(
            "Get Pomodoro Stats",
            "GET",
            "pomodoro/stats",
            200
        )
        
        if not success:
            return False
            
        # Get pomodoro stats by date
        success, response = self.run_test(
            "Get Pomodoro Stats by Date",
            "GET",
            "pomodoro/stats",
            200,
            params={"date": today}
        )
        
        return success

    def test_study_stats(self):
        """Test study statistics CRUD"""
        today = date.today().isoformat()
        
        # Create study stats
        stats_data = {
            "subject": "Fizik",
            "questions_solved": 15,
            "correct_answers": 12,
            "time_spent_minutes": 45,
            "date": today
        }
        
        success, response = self.run_test(
            "Create Study Stats",
            "POST",
            "study-stats",
            200,
            data=stats_data
        )
        
        if not success:
            return False
            
        # Get all study stats
        success, response = self.run_test(
            "Get All Study Stats",
            "GET",
            "study-stats",
            200
        )
        
        if not success:
            return False
            
        # Get study stats by date
        success, response = self.run_test(
            "Get Study Stats by Date",
            "GET",
            "study-stats",
            200,
            params={"date": today}
        )
        
        if not success:
            return False
            
        # Get study stats by subject
        success, response = self.run_test(
            "Get Study Stats by Subject",
            "GET",
            "study-stats",
            200,
            params={"subject": "Fizik"}
        )
        
        if not success:
            return False
            
        # Get study stats summary
        success, response = self.run_test(
            "Get Study Stats Summary",
            "GET",
            "study-stats/summary",
            200
        )
        
        return success

    def test_achievements(self):
        """Test achievements system"""
        # Get achievements
        success, response = self.run_test(
            "Get Achievements",
            "GET",
            "achievements",
            200
        )
        
        if success:
            self.created_achievement_count = len(response)
            print(f"   Current achievements: {self.created_achievement_count}")
            
        return success

    def test_achievement_triggers(self):
        """Test if achievements are triggered correctly"""
        today = date.today().isoformat()
        
        # Test first pomodoro achievement
        session_data = {
            "duration_minutes": 25,
            "session_type": "work",
            "subject": "Kimya",
            "date": today
        }
        
        success, response = self.run_test(
            "Create Pomodoro for Achievement",
            "POST",
            "pomodoro",
            200,
            data=session_data
        )
        
        if not success:
            return False
            
        # Test 100 questions achievement
        stats_data = {
            "subject": "Biyoloji",
            "questions_solved": 50,
            "correct_answers": 40,
            "time_spent_minutes": 120,
            "date": today
        }
        
        success, response = self.run_test(
            "Create Study Stats for Achievement",
            "POST",
            "study-stats",
            200,
            data=stats_data
        )
        
        if not success:
            return False
            
        # Add more questions to trigger 100 questions achievement
        stats_data2 = {
            "subject": "Tarih",
            "questions_solved": 60,
            "correct_answers": 45,
            "time_spent_minutes": 90,
            "date": today
        }
        
        success, response = self.run_test(
            "Create More Study Stats for Achievement",
            "POST",
            "study-stats",
            200,
            data=stats_data2
        )
        
        if not success:
            return False
            
        # Check if achievements were created
        success, response = self.run_test(
            "Check New Achievements",
            "GET",
            "achievements",
            200
        )
        
        if success:
            new_achievement_count = len(response)
            print(f"   Achievements before: {self.created_achievement_count}, after: {new_achievement_count}")
            if new_achievement_count > self.created_achievement_count:
                print(f"   ✅ New achievements created!")
                for achievement in response:
                    print(f"   🏆 {achievement['title']}: {achievement['description']}")
            else:
                print(f"   ⚠️  No new achievements created")
                
        return success

def main():
    print("🚀 Starting StudyFocus API Testing...")
    print("=" * 50)
    
    tester = StudyFocusAPITester()
    
    # Test all endpoints
    tests = [
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Task CRUD Operations", tester.test_task_crud),
        ("Pomodoro Sessions", tester.test_pomodoro_sessions),
        ("Study Statistics", tester.test_study_stats),
        ("Achievements", tester.test_achievements),
        ("Achievement Triggers", tester.test_achievement_triggers),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if failed_tests:
        print(f"❌ Failed test categories: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All test categories passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())