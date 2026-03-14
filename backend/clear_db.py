import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["Major_Project"]
    await db["auth_users"].drop()
    await db["companies"].drop()
    await db["representatives"].drop()
    await db["conversations"].drop()
    await db["messages"].drop()
    await db["digests"].drop()
    print("✅ All collections dropped!")
    client.close()

asyncio.run(clear_db())