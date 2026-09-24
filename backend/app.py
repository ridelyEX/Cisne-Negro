#import os
import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Literal

from security import hash_password, verify_password
#from sqlalchemy import create_engine
#from sqlalchemy.orm import sessionmaker
from database import engine, get_db
from models import Base, User, Respondent, Evaluation
import jwt
from sqlalchemy.orm import Session


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "cisneros_super_secret"

'''
# Configuración de base de datos MySQL local
DB_USER = "root"
DB_PASS = "root"
DB_HOST = "localhost"
DB_NAME = "cisnenegro_db"

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}")
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

def get_session():
    return SessionLocal()
'''

class LoginData(BaseModel):
    username: str
    password: str

class SubmitDemographicData(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=4, max_length=255)
    nombres: str = Field(min_length=1)
    num_empleado: int = Field(min_length=1)
    curp: str = Field(min_length=18, max_length=18)
    apellido_p: str = Field(min_length=1)
    apellido_m: str = Field(min_length=1)
    dependencia: str = Field(min_length=1)
    coordinacion: str = Field(min_length=1)
    departamento: str = Field(min_length=1)
    puesto: str = Field(min_length=1)
    cargo: str = Field(min_length=1)
    user_id: int | None = None


class SubmitQuestionsData(BaseModel):
    respondent_id: int
    autor_acoso: str = 'No aplica'
    answers: Dict[str, int]

    @field_validator('answers')
    @classmethod
    def validate_answers(cls, v):
        if len(v) != 43:
            raise ValueError('Deben Responderse las 43 preguntas')

        for key, value in v.items():
            if not key.startswith('q'):
                raise ValueError("Formato inválido de respuestas")
            if value not in range(0,7):
                raise ValueError(f"Valor inválido en {key}: debe ser entre 0 y 6")

        return v


@app.post("/api/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=data.username).first()

    if user and verify_password(data.password, user.password_hash):
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")

        return {"token": token, "role": user.role, "message": "Login successful"}

    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/Cuestionario-cisneros")
def submit_evaluation(data: SubmitQuestionsData, db: Session = Depends(get_db)):
    suma_total = 0
    neap = 0
    q_columns = {}

    for i in range(1, 44):
        val = int(data.answers.get(f'q{i}', 0))
        suma_total += val
        if val > 0:
            neap += 1
        q_columns[f'q{i}'] = val

    igap = suma_total / 43.0
    imap = (suma_total / neap) if neap > 0 else 0.0

    # Determinar nivel de riesgo
    risk_level = "Leve o inexistente"
    if imap >= 2.80:
        if igap < 1.23:
            risk_level = "Medio"
        else:
            risk_level = "Grave a muy grave"


    # Guardar evaluación
    evaluation = Evaluation(
        respondent_id=data.respondent_id,
        autor_acoso=data.autor_acoso,
        neap=neap,
        imap_score=imap,
        igap_score=igap,
        risk_level=risk_level,
        **q_columns
    )
    db.add(evaluation)
    db.commit()

    return {
        "message": "Evaluación guardada exitosamente",
        "results": {
            "neap": neap,
            "igap": round(igap, 2),
            "imap": round(imap, 2),
            "risk_level": risk_level
        }
    }

@app.post("/api/crear-usuario")
def create_user(data: SubmitDemographicData, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter_by(username=data.username).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="El nombre de usuario ya existe")

    # 1) Crear usuario de acceso
    new_user = User(
        username=data.username,
        password_hash=hash_password(data.password),
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 2) Crear respondent con datos demográficos
    respondent = Respondent(
        user_id=new_user.id,
        nombres=data.nombres,
        curp=data.curp,
        apellido_p=data.apellido_p,
        apellido_m=data.apellido_m,
        dependencia=data.dependencia,
        coordinacion=data.coordinacion,
        departamento=data.departamento,
        puesto=data.puesto,
        cargo=data.cargo
    )
    db.add(respondent)
    db.commit()
    db.refresh(respondent)

    return {
        "id": respondent.id,
        "user_id": new_user.id,
        "message": "Usuario creado correctamente"
    }

@app.get("/api/statistics")
def get_statistics(db: Session = Depends(get_db)):
    evaluations = db.query(Evaluation).all()

    total = len(evaluations)
    leve = len([e for e in evaluations if e.risk_level == "Leve o inexistente"])
    medio = len([e for e in evaluations if e.risk_level == "Medio"])
    grave = len([e for e in evaluations if e.risk_level == "Grave a muy grave"])

    avg_imap = sum(e.imap_score for e in evaluations) / total if total > 0 else 0
    avg_igap = sum(e.igap_score for e in evaluations) / total if total > 0 else 0

    return {
        "total_evaluations": total,
        "risk_distribution": {
            "leve": leve,
            "medio": medio,
            "grave": grave
        },
        "averages": {
            "imap": round(avg_imap, 2),
            "igap": round(avg_igap, 2)
        }
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
