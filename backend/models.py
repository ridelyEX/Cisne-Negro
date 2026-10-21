from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='user') # 'admin' or 'user'
    num_empleado = Column (String(10), nullable=True)

    respondents = relationship("Respondent", back_populates="user")

class Respondent(Base):
    __tablename__ = 'respondents'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Refers to User.id
    nombres = Column(String(100), nullable=False)
    apellido_p = Column(String(100), nullable=False)
    apellido_m = Column(String(100), nullable=False)
    curp = Column(String(18), nullable=False, unique=True)
    dependencia = Column(String(200), nullable=False)
    coordinacion = Column(String(100), nullable=False)
    departamento = Column(String(100), nullable=False)
    cargo = Column(String(100), nullable=True)
    puesto = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="respondents")
    evaluations = relationship("Evaluation", back_populates="respondent")
    
class Evaluation(Base):
    __tablename__ = 'evaluations'
    id = Column(Integer, primary_key=True, autoincrement=True)
    respondent_id = Column(Integer, ForeignKey("respondents.id"), nullable=False) # Refers to Respondent.id
    anonimo = Column(Boolean, default=True, nullable=False)

    q1 = Column(Integer, nullable=False)
    q2 = Column(Integer, nullable=False)
    q3 = Column(Integer, nullable=False)
    q4 = Column(Integer, nullable=False)
    q5 = Column(Integer, nullable=False)
    q6 = Column(Integer, nullable=False)
    q7 = Column(Integer, nullable=False)
    q8 = Column(Integer, nullable=False)
    q9 = Column(Integer, nullable=False)
    q10 = Column(Integer, nullable=False)
    q11 = Column(Integer, nullable=False)
    q12 = Column(Integer, nullable=False)
    q13 = Column(Integer, nullable=False)
    q14 = Column(Integer, nullable=False)
    q15 = Column(Integer, nullable=False)
    q16 = Column(Integer, nullable=False)
    q17 = Column(Integer, nullable=False)
    q18 = Column(Integer, nullable=False)
    q19 = Column(Integer, nullable=False)
    q20 = Column(Integer, nullable=False)
    q21 = Column(Integer, nullable=False)
    q22 = Column(Integer, nullable=False)
    q23 = Column(Integer, nullable=False)
    q24 = Column(Integer, nullable=False)
    q25 = Column(Integer, nullable=False)
    q26 = Column(Integer, nullable=False)
    q27 = Column(Integer, nullable=False)
    q28 = Column(Integer, nullable=False)
    q29 = Column(Integer, nullable=False)
    q30 = Column(Integer, nullable=False)
    q31 = Column(Integer, nullable=False)
    q32 = Column(Integer, nullable=False)
    q33 = Column(Integer, nullable=False)
    q34 = Column(Integer, nullable=False)
    q35 = Column(Integer, nullable=False)
    q36 = Column(Integer, nullable=False)
    q37 = Column(Integer, nullable=False)
    q38 = Column(Integer, nullable=False)
    q39 = Column(Integer, nullable=False)
    q40 = Column(Integer, nullable=False)
    q41 = Column(Integer, nullable=False)
    q42 = Column(Integer, nullable=False)
    q43 = Column(Integer, nullable=False)
    
    autor_acoso = Column(String(100), nullable=False)
    
    neap = Column(Integer, nullable=False)
    imap_score = Column(Float, nullable=False)
    igap_score = Column(Float, nullable=False)
    risk_level = Column(String(50), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    respondent = relationship("Respondent", back_populates="evaluations")
