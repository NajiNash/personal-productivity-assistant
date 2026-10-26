from fastapi import FastAPI, HTTPException
from database import initialize_database, load_tasks_from_database, add_tasks_to_database, complete_task_in_database, delete_task_from_database, update_task_in_database
from pydantic import BaseModel, Field, field_validator
from task import Task
from services import build_next_occurrence, calculate_statistics, get_overdue_tasks, plan_tasks
from fastapi.middleware.cors import CORSMiddleware
from ai_service import parse_task_from_text
from typing import Literal
from datetime import datetime

class TaskCreate(BaseModel):
    title: str = Field(min_length=1)

    priority: Literal[
        "High",
        "Medium",
        "Low"
    ]

    due_date: str

    category: Literal[
        "Work",
        "Study",
        "Personal",
        "Other"
    ]

    estimated_duration: int = Field(gt=0)

    recurrence: Literal[
        "None",
        "Daily",
        "Weekly",
        "Monthly"
    ] = "None"

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, value):
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            raise ValueError(
                "Due date must use YYYY-MM-DD format."
            )

        return value

class TaskUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1
    )

    priority: Literal[
        "High",
        "Medium",
        "Low"
    ] | None = None

    due_date: str | None = None

    category: Literal[
        "Work",
        "Study",
        "Personal",
        "Other"
    ] | None = None

    estimated_duration: int | None = Field(
        default=None,
        gt=0
    )

    recurrence: Literal[
        "None",
        "Daily",
        "Weekly",
        "Monthly"
    ] | None = None

    @field_validator("due_date")
    @classmethod
    def validate_due_date(cls, value):
        if value is None:
            return value

        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            raise ValueError(
                "Due date must use YYYY-MM-DD format."
            )

        return value

class PlanRequest(BaseModel):
    plan_date: str
    available_minutes: int

class AIParseRequest(BaseModel):
    text: str


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

initialize_database()

@app.get("/")
def root():
    return {
        "message": "Personal Productivity Assistant API"
    }

@app.post("/ai/parse-task")
def parse_ai_task(request: AIParseRequest):
    try:
        task = parse_task_from_text(request.text)

        return task.model_dump()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="AI task parsing failed."
        ) from error

@app.get("/tasks")
def get_tasks():
    tasks = load_tasks_from_database()

    return[
         {
        "id": task.id,
            "title": task.title,
            "priority": task.priority,
            "due_date": task.due_date,
            "category": task.category,
            "estimated_duration": task.estimated_duration,
            "recurrence": task.recurrence,
            "completed": task.completed
    }
    for task in tasks
    ]

@app.post("/tasks")
def create_task(task_data: TaskCreate):
    task = Task(
        None,
         task_data.title,
        task_data.priority,
        task_data.due_date,
        task_data.category,
        task_data.estimated_duration,
        task_data.recurrence
    )

    add_tasks_to_database(task)

    return{
        "id": task.id,
        "title": task.title,
        "priority": task.priority,
        "due_date": task.due_date,
        "category": task.category,
        "estimated_duration": task.estimated_duration,
        "recurrence": task.recurrence,
        "completed": task.completed
    }

@app.patch("/tasks/{task_id}/complete")
def complete_task(task_id: int):
    tasks = load_tasks_from_database()

    for task in tasks:
        if task.id == task_id:

            if task.completed:
                return {
                    "message": "Task is already completed."
                }

            task.mark_complete()
            complete_task_in_database(task.id)

            next_task = build_next_occurrence(task)

            if next_task is not None:
                add_tasks_to_database(next_task)

            return {
                "message": "Task marked as complete.",
                "task_id": task.id,
                "next_occurrence_id": (
                    next_task.id
                    if next_task is not None
                    else None
                )
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found."
    )

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    tasks = load_tasks_from_database()

    for task in tasks:
        if task.id == task_id:
            delete_task_from_database(task_id)

            return{
                "message": "Task deleted successfully.",
                "task_id": task_id
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found."
    )

@app.patch("/tasks/{task_id}")
def update_task(task_id: int, task_data: TaskUpdate):
    tasks = load_tasks_from_database()

    for task in tasks:
        if task.id == task_id:

            if task_data.title is not None:
                task.title = task_data.title

            if task_data.priority is not None:
                task.priority = task_data.priority

            if task_data.due_date is not None:
                task.due_date = task_data.due_date

            if task_data.category is not None:
                task.category = task_data.category

            if task_data.estimated_duration is not None:
                task.estimated_duration = task_data.estimated_duration

            if task_data.recurrence is not None:
                task.recurrence = task_data.recurrence

            update_task_in_database(task)

            return {
                "id": task.id,
                "title": task.title,
                "priority": task.priority,
                "due_date": task.due_date,
                "category": task.category,
                "estimated_duration": task.estimated_duration,
                "recurrence": task.recurrence,
                "completed": task.completed
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found."
    )

@app.get("/statistics")
def get_statistics():
    tasks = load_tasks_from_database()

    return calculate_statistics(tasks)

@app.get("/tasks/overdue")
def get_overdue():
    tasks = load_tasks_from_database()
    overdue_tasks = get_overdue_tasks(tasks)

    return [
        {
            "id": task.id,
            "title": task.title,
            "priority": task.priority,
            "due_date": task.due_date,
            "category": task.category,
            "estimated_duration": task.estimated_duration,
            "recurrence": task.recurrence,
            "completed": task.completed
        }
        for task in overdue_tasks
    ]

@app.post("/plan")
def create_plan(plan_data: PlanRequest):
    tasks = load_tasks_from_database()

    result = plan_tasks(
        tasks,
        plan_data.plan_date,
        plan_data.available_minutes
    )

    return {
        "plan_date": plan_data.plan_date,
        "available_minutes": plan_data.available_minutes,

        "planned_tasks": [
            {
                "id": task.id,
                "title": task.title,
                "priority": task.priority,
                "due_date": task.due_date,
                "category": task.category,
                "estimated_duration": task.estimated_duration,
                "recurrence": task.recurrence,
                "completed": task.completed
            }
            for task in result["planned_tasks"]
        ],

        "unscheduled_tasks": [
            {
                "id": task.id,
                "title": task.title,
                "priority": task.priority,
                "due_date": task.due_date,
                "category": task.category,
                "estimated_duration": task.estimated_duration,
                "recurrence": task.recurrence,
                "completed": task.completed
            }
            for task in result["unscheduled_tasks"]
        ],

        "scheduled_minutes": result["scheduled_minutes"],
        "remaining_minutes": result["remaining_minutes"]
    }