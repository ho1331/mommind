from fastapi import APIRouter
from app.api.v1 import auth, moods, plans, articles, chat, subscription

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(moods.router)
api_router.include_router(plans.router)
api_router.include_router(articles.router)
api_router.include_router(chat.router)
api_router.include_router(subscription.router)
