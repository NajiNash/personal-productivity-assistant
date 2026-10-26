import json
from datetime import date
from typing import Literal

from groq import Groq
from pydantic import BaseModel, ConfigDict, Field


class AITask(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str

    priority: Literal[
        "High",
        "Medium",
        "Low"
    ]

    due_date: date

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
    ]


def parse_task_from_text(user_text: str) -> AITask:
    client = Groq()

    today = date.today().isoformat()

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",

        messages=[
            {
                "role": "system",
                "content": (
                    "You convert natural-language task descriptions "
                    "into structured task data. "
                    f"Today's date is {today}. "
                    "Resolve relative dates such as today, tomorrow, "
                    "and next Monday into YYYY-MM-DD dates. "
                    "Use only the allowed values from the provided schema."
                ),
            },
            {
                "role": "user",
                "content": user_text,
            },
        ],

        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "task",
                "strict": True,
                "schema": AITask.model_json_schema(),
            },
        },
    )

    content = response.choices[0].message.content

    task_data = json.loads(content)

    return AITask.model_validate(task_data)