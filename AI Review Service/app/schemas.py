from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AIReviewCreate(BaseModel):
    article_id: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, max_length=1000)
    abstract: str | None = Field(default=None, max_length=30000)
    manuscript_text: str | None = Field(default=None, max_length=120000)
    language: Literal["ru", "kk", "en"] = "ru"
    additional_instructions: str | None = Field(default=None, max_length=3000)

    @model_validator(mode="after")
    def validate_source(self):
        if self.article_id is None and not any((self.title, self.abstract, self.manuscript_text)):
            raise ValueError("Provide article_id or manuscript content")
        return self


class AIReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    article_id: int | None
    requested_by: int
    status: str
    language: str
    title: str | None
    review_text: str | None
    recommendation: str | None
    strengths: list[str] | None
    weaknesses: list[str] | None
    publication_recommendations: list[str] | None
    scores: dict[str, int] | None
    model: str | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None

