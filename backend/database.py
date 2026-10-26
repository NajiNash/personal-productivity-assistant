import sqlite3
from task import Task

DATABASE_NAME = "tasks.db"

def initialize_database():
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            priority TEXT NOT NULL,
            due_date TEXT NOT NULL,
            completed INTEGER NOT NULL,
            category TEXT NOT NULL DEFAULT 'Other',
            estimated_duration INTEGER NOT NULL DEFAULT 0,
            recurrence TEXT NOT NULL DEFAULT 'None'
        )
    """)

    cursor.execute("PRAGMA table_info(tasks)")
    columns = [column[1] for column in cursor.fetchall()]

    if "category" not in columns:
        cursor.execute(
            "ALTER TABLE tasks "
            "ADD COLUMN category TEXT NOT NULL DEFAULT 'Other'"
        )

    if "estimated_duration" not in columns:
        cursor.execute(
            "ALTER TABLE tasks "
            "ADD COLUMN estimated_duration INTEGER NOT NULL DEFAULT 0"
        )

    if "recurrence" not in columns:
        cursor.execute(
            "ALTER TABLE tasks "
            "ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'None'"
        )

    connection.commit()
    connection.close()

def add_tasks_to_database(task):
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()

    cursor.execute("""
    INSERT INTO tasks (title, priority, due_date, completed, category, estimated_duration, recurrence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            task.title,
            task.priority,
            task.due_date,
            int(task.completed),
            task.category,
            task.estimated_duration,
            task.recurrence
        )
    )

    task.id = cursor.lastrowid

    connection.commit()
    connection.close()

def load_tasks_from_database():
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, title, priority, due_date, category, estimated_duration, recurrence, completed
        FROM tasks
        """
    )

    rows = cursor.fetchall()

    connection.close()

    return[
        Task(
            row[0],
            row[1],
            row[2],
            row[3],
            row[4],
            row[5],
            row[6],
            bool(row[7])
        )
        for row in rows
    ]

def complete_task_in_database(task_id):
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE tasks
        SET completed = 1
        WHERE id = ?
        """,
        (task_id,)
    )

    connection.commit()
    connection.close()

def delete_task_from_database(task_id):
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM tasks
        WHERE id = ?
        """,
        (task_id,)
    )

    connection.commit()
    connection.close()

def edit_task_in_database(task_id, new_title):
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE tasks
        SET title = ?
        WHERE id = ?
        """,
        (new_title, task_id)
    )

    connection.commit()
    connection.close()

def update_task_in_database(task):
    connection = sqlite3.connect(DATABASE_NAME)
    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE tasks
        SET
            title = ?,
            priority = ?,
            due_date = ?,
            category = ?,
            estimated_duration = ?,
            recurrence = ?
        WHERE id = ?
        """,
        (
            task.title,
            task.priority,
            task.due_date,
            task.category,
            task.estimated_duration,
            task.recurrence,
            task.id
        )
    )

    connection.commit()
    connection.close()