from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost/cisnenegro_db")

engine = create_engine(
    DATABASE_URL,
    echo=False, # Oculta las queries SQL en consola
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db() -> Generator[Session, None, None]:
    """Obtiene sessión de DB en endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
