from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subject: str
    description: Optional[str] = None
    completed: bool = False
    priority: str = "medium"  # low, medium, high
    date: str  # YYYY-MM-DD format
    duration_minutes: int = 25
    subtasks: List[dict] = []  # [{"title": str, "completed": bool}]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    subject: str
    description: Optional[str] = None
    priority: str = "medium"
    date: str
    duration_minutes: int = 25
    subtasks: List[dict] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    date: Optional[str] = None
    duration_minutes: Optional[int] = None
    subtasks: Optional[List[dict]] = None

class PomodoroSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    duration_minutes: int
    session_type: str  # work, break
    subject: Optional[str] = None
    completed: bool = True
    mood_after: Optional[str] = None  # happy, neutral, tired
    date: str  # YYYY-MM-DD format
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PomodoroSessionCreate(BaseModel):
    duration_minutes: int
    session_type: str
    subject: Optional[str] = None
    date: str
    mood_after: Optional[str] = None

class StudyStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subject: str
    questions_solved: int
    correct_answers: int
    time_spent_minutes: int
    date: str  # YYYY-MM-DD format
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudyStatsCreate(BaseModel):
    subject: str
    questions_solved: int
    correct_answers: int
    time_spent_minutes: int
    date: str

class Achievement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    badge_type: str
    title: str
    description: str
    icon: str = "🏆"
    earned_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FocusTree(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tree_type: str  # seedling, young, mature
    duration_minutes: int
    subject: str
    survived: bool
    date: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FocusTreeCreate(BaseModel):
    tree_type: str
    duration_minutes: int
    subject: str
    survived: bool
    date: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "default_user"  # Single user for now
    level: int = 1
    experience: int = 0
    trees_planted: int = 0
    total_focus_minutes: int = 0
    character_type: str = "seed"  # seed, sprout, tree, forest
    notification_settings: dict = {
        "daily_summary": True,
        "task_reminders": True,
        "break_reminders": True,
        "achievement_alerts": True
    }


# Task Routes
@api_router.post("/tasks", response_model=Task)
async def create_task(input: TaskCreate):
    task_dict = input.model_dump()
    task_obj = Task(**task_dict)
    
    doc = task_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.tasks.insert_one(doc)
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(date: Optional[str] = None):
    query = {}
    if date:
        query['date'] = date
    
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    
    for task in tasks:
        if isinstance(task['created_at'], str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
    
    return tasks

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, input: TaskUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.tasks.find_one_and_update(
        {"id": task_id},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    
    result.pop('_id', None)
    if isinstance(result['created_at'], str):
        result['created_at'] = datetime.fromisoformat(result['created_at'])
    
    return Task(**result)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}


# Pomodoro Routes
@api_router.post("/pomodoro", response_model=PomodoroSession)
async def create_pomodoro_session(input: PomodoroSessionCreate):
    session_dict = input.model_dump()
    session_obj = PomodoroSession(**session_dict)
    
    doc = session_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.pomodoro_sessions.insert_one(doc)
    
    # Update user profile
    if session_obj.session_type == "work":
        await db.user_profile.update_one(
            {"id": "default_user"},
            {"$inc": {"total_focus_minutes": session_obj.duration_minutes, "experience": 10}},
            upsert=True
        )
    
    # Check achievements
    await check_and_award_achievements()
    
    return session_obj

@api_router.get("/pomodoro/stats")
async def get_pomodoro_stats(date: Optional[str] = None):
    query = {}
    if date:
        query['date'] = date
    
    sessions = await db.pomodoro_sessions.find(query, {"_id": 0}).to_list(1000)
    
    work_sessions = [s for s in sessions if s['session_type'] == 'work']
    total_work_time = sum(s['duration_minutes'] for s in work_sessions)
    total_sessions = len(work_sessions)
    
    return {
        "total_sessions": total_sessions,
        "total_work_minutes": total_work_time,
        "sessions": sessions
    }


# Study Stats Routes
@api_router.post("/study-stats", response_model=StudyStats)
async def create_study_stats(input: StudyStatsCreate):
    stats_dict = input.model_dump()
    stats_obj = StudyStats(**stats_dict)
    
    doc = stats_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.study_stats.insert_one(doc)
    
    # Update experience
    await db.user_profile.update_one(
        {"id": "default_user"},
        {"$inc": {"experience": stats_obj.questions_solved * 2}},
        upsert=True
    )
    
    # Check achievements
    await check_and_award_achievements()
    
    return stats_obj

@api_router.get("/study-stats")
async def get_study_stats(date: Optional[str] = None, subject: Optional[str] = None):
    query = {}
    if date:
        query['date'] = date
    if subject:
        query['subject'] = subject
    
    stats = await db.study_stats.find(query, {"_id": 0}).to_list(1000)
    
    return stats

@api_router.get("/study-stats/summary")
async def get_study_stats_summary():
    stats = await db.study_stats.aggregate([
        {
            "$group": {
                "_id": "$subject",
                "total_questions": {"$sum": "$questions_solved"},
                "total_correct": {"$sum": "$correct_answers"},
                "total_time": {"$sum": "$time_spent_minutes"}
            }
        }
    ]).to_list(1000)
    
    result = []
    for stat in stats:
        accuracy = (stat['total_correct'] / stat['total_questions'] * 100) if stat['total_questions'] > 0 else 0
        result.append({
            "subject": stat['_id'],
            "total_questions": stat['total_questions'],
            "total_correct": stat['total_correct'],
            "total_time_minutes": stat['total_time'],
            "accuracy": round(accuracy, 1)
        })
    
    return result


# Achievement Routes
@api_router.get("/achievements", response_model=List[Achievement])
async def get_achievements():
    achievements = await db.achievements.find({}, {"_id": 0}).to_list(1000)
    
    for achievement in achievements:
        if isinstance(achievement['earned_date'], str):
            achievement['earned_date'] = datetime.fromisoformat(achievement['earned_date'])
    
    return achievements

async def check_and_award_achievements():
    # Check for various achievements
    
    # First pomodoro
    pomodoro_count = await db.pomodoro_sessions.count_documents({"session_type": "work"})
    if pomodoro_count == 1:
        existing = await db.achievements.find_one({"badge_type": "first_pomodoro"})
        if not existing:
            achievement = Achievement(
                badge_type="first_pomodoro",
                title="İlk Pomodoro!",
                description="İlk çalışma seansını tamamladın!",
                icon="🌱"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    # 10 pomodoros
    if pomodoro_count >= 10:
        existing = await db.achievements.find_one({"badge_type": "10_pomodoros"})
        if not existing:
            achievement = Achievement(
                badge_type="10_pomodoros",
                title="10 Pomodoro!",
                description="10 çalışma seansı tamamladın!",
                icon="🌿"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    # Question milestones
    total_questions = await db.study_stats.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$questions_solved"}}}
    ]).to_list(1)
    
    if total_questions and total_questions[0]['total'] >= 100:
        existing = await db.achievements.find_one({"badge_type": "100_questions"})
        if not existing:
            achievement = Achievement(
                badge_type="100_questions",
                title="100 Soru!",
                description="100 soru çözdün! Harika gidiyorsun!",
                icon="🎯"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    if total_questions and total_questions[0]['total'] >= 500:
        existing = await db.achievements.find_one({"badge_type": "500_questions"})
        if not existing:
            achievement = Achievement(
                badge_type="500_questions",
                title="500 Soru!",
                description="500 soru tamamladın! İnanılmaz!",
                icon="🌟"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    if total_questions and total_questions[0]['total'] >= 1000:
        existing = await db.achievements.find_one({"badge_type": "1000_questions"})
        if not existing:
            achievement = Achievement(
                badge_type="1000_questions",
                title="1000 Soru!",
                description="1000 soru! Sen bir efsanesin!",
                icon="💎"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    # Streak achievements
    streak = await calculate_streak()
    
    if streak >= 3:
        existing = await db.achievements.find_one({"badge_type": "3_day_streak"})
        if not existing:
            achievement = Achievement(
                badge_type="3_day_streak",
                title="3 Gün Serisi!",
                description="3 gün üst üste çalıştın!",
                icon="🔥"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    if streak >= 7:
        existing = await db.achievements.find_one({"badge_type": "7_day_streak"})
        if not existing:
            achievement = Achievement(
                badge_type="7_day_streak",
                title="Haftalık Şampiyon!",
                description="7 gün boyunca çalışma disiplini!",
                icon="⚡"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    if streak >= 14:
        existing = await db.achievements.find_one({"badge_type": "14_day_streak"})
        if not existing:
            achievement = Achievement(
                badge_type="14_day_streak",
                title="İki Hafta Savaşçısı!",
                description="14 gün kesintisiz çalışma!",
                icon="🌠"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)
    
    if streak >= 30:
        existing = await db.achievements.find_one({"badge_type": "30_day_streak"})
        if not existing:
            achievement = Achievement(
                badge_type="30_day_streak",
                title="Aylık Master!",
                description="30 gün! İnanılmaz bir disiplin!",
                icon="👑"
            )
            doc = achievement.model_dump()
            doc['earned_date'] = doc['earned_date'].isoformat()
            await db.achievements.insert_one(doc)

async def calculate_streak():
    all_dates = await db.pomodoro_sessions.distinct("date")
    all_dates = sorted([d for d in all_dates if d], reverse=True)
    
    if not all_dates:
        return 0
    
    streak = 0
    current_date = date.today()
    
    for session_date_str in all_dates:
        try:
            session_date = date.fromisoformat(session_date_str)
            expected_date = current_date - timedelta(days=streak)
            
            if session_date == expected_date:
                streak += 1
            elif session_date < expected_date:
                break
        except:
            continue
    
    return streak


# Focus Tree Routes
@api_router.post("/focus-trees", response_model=FocusTree)
async def create_focus_tree(input: FocusTreeCreate):
    tree_dict = input.model_dump()
    tree_obj = FocusTree(**tree_dict)
    
    doc = tree_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.focus_trees.insert_one(doc)
    
    # Update user stats
    if tree_obj.survived:
        await db.user_profile.update_one(
            {"id": "default_user"},
            {"$inc": {"trees_planted": 1, "experience": 25}},
            upsert=True
        )
    
    return tree_obj

@api_router.get("/focus-trees")
async def get_focus_trees():
    trees = await db.focus_trees.find({}, {"_id": 0}).to_list(1000)
    return trees


# User Profile Routes
@api_router.get("/profile")
async def get_profile():
    profile = await db.user_profile.find_one({"id": "default_user"}, {"_id": 0})
    
    if not profile:
        # Create default profile
        default_profile = UserProfile().model_dump()
        await db.user_profile.insert_one(default_profile)
        return default_profile
    
    # Calculate level from experience
    exp = profile.get('experience', 0)
    level = 1 + (exp // 100)  # Every 100 XP = 1 level
    profile['level'] = level
    
    # Determine character type
    if level < 5:
        profile['character_type'] = 'seed'
    elif level < 15:
        profile['character_type'] = 'sprout'
    elif level < 30:
        profile['character_type'] = 'tree'
    else:
        profile['character_type'] = 'forest'
    
    return profile

@api_router.put("/profile/settings")
async def update_profile_settings(settings: dict):
    result = await db.user_profile.update_one(
        {"id": "default_user"},
        {"$set": {"notification_settings": settings}},
        upsert=True
    )
    return {"message": "Settings updated"}


# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    today = date.today().isoformat()
    
    # Today's tasks
    today_tasks = await db.tasks.count_documents({"date": today})
    completed_tasks = await db.tasks.count_documents({"date": today, "completed": True})
    
    # Today's pomodoro sessions
    today_pomodoros = await db.pomodoro_sessions.count_documents({"date": today, "session_type": "work"})
    
    # Today's study time
    today_stats = await db.study_stats.find({"date": today}, {"_id": 0}).to_list(1000)
    today_study_time = sum(s.get('time_spent_minutes', 0) for s in today_stats)
    today_questions = sum(s.get('questions_solved', 0) for s in today_stats)
    
    # Total achievements
    total_achievements = await db.achievements.count_documents({})
    
    # Calculate streak
    streak = await calculate_streak()
    
    return {
        "today_tasks": today_tasks,
        "completed_tasks": completed_tasks,
        "today_pomodoros": today_pomodoros,
        "today_study_minutes": today_study_time,
        "today_questions": today_questions,
        "total_achievements": total_achievements,
        "current_streak": streak
    }


# Heat Map Data
@api_router.get("/heatmap")
async def get_heatmap_data(days: int = 90):
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    
    # Get all pomodoro sessions
    sessions = await db.pomodoro_sessions.find(
        {"session_type": "work"},
        {"_id": 0, "date": 1, "duration_minutes": 1}
    ).to_list(10000)
    
    # Group by date
    heatmap_data = {}
    for session in sessions:
        session_date = session.get('date')
        if session_date:
            if session_date not in heatmap_data:
                heatmap_data[session_date] = 0
            heatmap_data[session_date] += session.get('duration_minutes', 0)
    
    return heatmap_data


# Weekly Report
@api_router.get("/reports/weekly")
async def get_weekly_report():
    end_date = date.today()
    start_date = end_date - timedelta(days=7)
    
    # Pomodoro sessions
    pomodoros = await db.pomodoro_sessions.count_documents({
        "session_type": "work",
        "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
    })
    
    # Study stats
    stats = await db.study_stats.find({
        "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    total_questions = sum(s.get('questions_solved', 0) for s in stats)
    total_correct = sum(s.get('correct_answers', 0) for s in stats)
    total_time = sum(s.get('time_spent_minutes', 0) for s in stats)
    
    # Tasks completed
    tasks_completed = await db.tasks.count_documents({
        "completed": True,
        "date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
    })
    
    # New achievements
    achievements = await db.achievements.count_documents({
        "earned_date": {"$gte": start_date.isoformat(), "$lte": end_date.isoformat()}
    })
    
    return {
        "week_start": start_date.isoformat(),
        "week_end": end_date.isoformat(),
        "total_pomodoros": pomodoros,
        "total_questions": total_questions,
        "total_correct": total_correct,
        "accuracy": round((total_correct / total_questions * 100) if total_questions > 0 else 0, 1),
        "total_study_minutes": total_time,
        "tasks_completed": tasks_completed,
        "new_achievements": achievements
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
