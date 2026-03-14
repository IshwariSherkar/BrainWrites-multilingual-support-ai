from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class DBModelBase(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

    def model_dump(self, *args, **kwargs):
        # Handle case where kwargs is None
        if kwargs is None:
            kwargs = {}
        
        # Exclude _id when dumping to avoid conflicts
        exclude = kwargs.get('exclude', set())
        exclude.add('_id')
        kwargs['exclude'] = exclude
        
        return super().model_dump(*args, **kwargs)