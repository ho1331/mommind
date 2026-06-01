import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base, get_db
from app.core.config import settings
import app.models.user  # noqa: F401 — registers User with Base.metadata
import app.models.mood  # noqa: F401
import app.models.plan  # noqa: F401
import app.models.subscription  # noqa: F401
import app.models.article  # noqa: F401
import app.models.chat  # noqa: F401
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Test DB runs on Docker port 5433 (db_test service in docker-compose.yml)
TEST_DB_URL = "postgresql://postgres:password@localhost:5435/mommind_test"
engine = create_engine(TEST_DB_URL)
TestingSession = sessionmaker(bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSession(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db):
    def override_db():
        yield db

    # Import app here to avoid circular imports
    from main import app
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
