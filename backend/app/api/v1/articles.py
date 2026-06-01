from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.article import Article
from app.schemas.article import ArticleOut, ArticleListItem

router = APIRouter(prefix="/articles", tags=["articles"])


@router.get("", response_model=List[ArticleOut])
def list_articles(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Article).order_by(Article.category, Article.id).all()


@router.get("/{article_id}", response_model=ArticleOut)
def get_article(article_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    article = db.get(Article, article_id)
    if not article:
        raise HTTPException(status_code=404)
    return article
