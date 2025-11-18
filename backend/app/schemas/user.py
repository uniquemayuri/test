from pydantic import BaseModel, constr

class UserSchema(BaseModel):
    id: int
    username: str
    email: str
    password: constr(min_length=8, max_length=72)

    class Config:
        orm_mode = True
