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
from datetime import datetime, timezone


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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    title: str
    subject: str
    description: Optional[str] = None
    priority: str = "medium"
    date: str
    duration_minutes: int = 25

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    date: Optional[str] = None
    duration_minutes: Optional[int] = None

class PomodoroSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    duration_minutes: int
    session_type: str  # work, break
    subject: Optional[str] = None
    completed: bool = True
    date: str  # YYYY-MM-DD format
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PomodoroSessionCreate(BaseModel):
    duration_minutes: int
    session_type: str
    subject: Optional[str] = None
    date: str

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
    badge_type: str  # first_pomodoro, 7_day_streak, 100_questions, etc.
    title: str
    description: str
    earned_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    
    # Check for first pomodoro achievement
    existing_sessions = await db.pomodoro_sessions.count_documents({"session_type": "work"})
    if existing_sessions == 1:
        achievement = Achievement(
            badge_type="first_pomodoro",
            title="İlk Pomodoro!",
            description="İlk çalışma seansını tamamladın!"
        )
        ach_doc = achievement.model_dump()
        ach_doc['earned_date'] = ach_doc['earned_date'].isoformat()
        await db.achievements.insert_one(ach_doc)
    
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
    
    # Check for 100 questions achievement
    total_questions = await db.study_stats.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$questions_solved"}}}
    ]).to_list(1)
    
    if total_questions and total_questions[0]['total'] >= 100:
        existing_achievement = await db.achievements.find_one({"badge_type": "100_questions"})
        if not existing_achievement:
            achievement = Achievement(
                badge_type="100_questions",
                title="100 Soru!",
                description="100 soru çözdün! Harika gidiyorsun!"
            )
            ach_doc = achievement.model_dump()
            ach_doc['earned_date'] = ach_doc['earned_date'].isoformat()
            await db.achievements.insert_one(ach_doc)
    
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
    # Aggregate stats by subject
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


# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    from datetime import date
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
    
    # Calculate streak (consecutive days with pomodoro sessions)
    all_dates = await db.pomodoro_sessions.distinct("date")
    all_dates = sorted([d for d in all_dates if d], reverse=True)
    
    streak = 0
    current_date = date.today()
    for session_date in all_dates:
        if session_date == current_date.isoformat():
            streak += 1
            current_date = date.fromisoformat(current_date.isoformat())
            from datetime import timedelta
            current_date = current_date - timedelta(days=1)
        elif session_date == current_date.isoformat():
            streak += 1
            from datetime import timedelta
            current_date = current_date - timedelta(days=1)
        else:
            break
    
    return {
        "today_tasks": today_tasks,
        "completed_tasks": completed_tasks,
        "today_pomodoros": today_pomodoros,
        "today_study_minutes": today_study_time,
        "today_questions": today_questions,
        "total_achievements": total_achievements,
        "current_streak": streak
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
