#import os
import datetime
from datetime import date

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, field_validator
from typing import Dict, Optional
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
import jwt

from security import hash_password, verify_password
from database import engine, get_db
from models import Base, User, Respondent, Evaluation, SurveyStage


Base.metadata.create_all(bind=engine)

def ensure_schema_updates():
    """Agrega columnas nuevas como stage_id en evaluations, dependencia en users y campos de aprobación en survey_stages."""
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if "users" in tables:
            user_cols = [col["name"] for col in inspector.get_columns("users")]
            if "dependencia" not in user_cols:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN dependencia VARCHAR(200) NULL DEFAULT 'Dirección de Obras Públicas'"))
        if "evaluations" in tables:
            columns = [col["name"] for col in inspector.get_columns("evaluations")]
            if "stage_id" not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE evaluations ADD COLUMN stage_id INT NULL"))
        if "survey_stages" in tables:
            stage_cols = [col["name"] for col in inspector.get_columns("survey_stages")]
            with engine.begin() as conn:
                if "apply_to_all" not in stage_cols:
                    conn.execute(text("ALTER TABLE survey_stages ADD COLUMN apply_to_all TINYINT(1) NOT NULL DEFAULT 1"))
                if "target_dependencia" not in stage_cols:
                    conn.execute(text("ALTER TABLE survey_stages ADD COLUMN target_dependencia VARCHAR(200) NULL"))
                if "approval_status" not in stage_cols:
                    conn.execute(text("ALTER TABLE survey_stages ADD COLUMN approval_status VARCHAR(30) NOT NULL DEFAULT 'approved'"))
                if "requested_by" not in stage_cols:
                    conn.execute(text("ALTER TABLE survey_stages ADD COLUMN requested_by VARCHAR(100) NULL"))
    except Exception as e:
        print(f"Schema check warning: {e}")

ensure_schema_updates()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "cisneros_super_secret"

security_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="El token ha expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido: sin user_id")

    user = db.query(User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return current_user

def get_current_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="No tienes permisos de superadministrador")
    return current_user


class LoginData(BaseModel):
    username: str
    password: str

class SubmitDemographicData(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=4, max_length=255)
    nombres: str = Field(min_length=1)
    num_empleado: str = Field(min_length=1, max_length=10)
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
    respondent_id: int | None = None
    autor_acoso: str = 'No aplica'
    anonimo: bool = True
    answers: Dict[str, int]

    @field_validator('answers')
    @classmethod
    def validate_answers(cls, v):
        if len(v) != 43:
            raise ValueError('Deben Responderse las 43 preguntas')

        for key, value in v.items():
            if not key.startswith('q'):
                raise ValueError("Formato inválido de respuestas")
            if value not in range(0, 7):
                raise ValueError(f"Valor inválido en {key}: debe ser entre 0 y 6")

        return v


class CreateStageData(BaseModel):
    instrument_name: str = Field(min_length=1, max_length=150)
    start_date: date
    end_date: date
    target_applications: int = Field(ge=1)
    apply_to_all: bool = True
    target_dependencia: Optional[str] = None
    is_active: bool = True

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, end_date_val, info):
        start_date_val = info.data.get('start_date')
        if start_date_val and end_date_val < start_date_val:
            raise ValueError('La fecha de fin no puede ser anterior a la fecha de inicio')
        return end_date_val

    @field_validator('target_dependencia')
    @classmethod
    def validate_target_dependencia(cls, dep_val, info):
        apply_all = info.data.get('apply_to_all', True)
        if not apply_all and (not dep_val or not dep_val.strip()):
            raise ValueError('Debes seleccionar la dependencia a la que se asignará esta etapa')
        return dep_val.strip() if dep_val else None


class CreateAdminStageData(BaseModel):
    instrument_name: str = Field(min_length=1, max_length=150)
    start_date: date
    end_date: date
    target_applications: int = Field(ge=1)

    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, end_date_val, info):
        start_date_val = info.data.get('start_date')
        if start_date_val and end_date_val < start_date_val:
            raise ValueError('La fecha de fin no puede ser anterior a la fecha de inicio')
        return end_date_val


class ApprovalActionData(BaseModel):
    action: str = Field(pattern="^(approve|reject)$")


def get_admin_dependencia(user: User, db: Session) -> str:
    respondent = db.query(Respondent).filter_by(user_id=user.id).first()
    if respondent and respondent.dependencia and respondent.dependencia.strip():
        return respondent.dependencia.strip()
    user_dep = getattr(user, "dependencia", None)
    if user_dep and user_dep.strip():
        return user_dep.strip()
    return "Dirección de Obras Públicas"


def respondent_belongs_to_dependencia(respondent: Optional[Respondent], dependencia_name: str) -> bool:
    if not respondent:
        return False
    dep_norm = (dependencia_name or "").strip().lower()
    if not dep_norm:
        return True
    r_dep = (respondent.dependencia or "").strip().lower()
    r_coord = (respondent.coordinacion or "").strip().lower()
    return dep_norm in (r_dep, r_coord)


def compute_evaluations_metrics(evaluations: list[Evaluation]):
    total = len(evaluations)
    leve = len([e for e in evaluations if e.risk_level == "Leve o inexistente"])
    medio = len([e for e in evaluations if e.risk_level == "Medio"])
    grave = len([e for e in evaluations if e.risk_level == "Grave a muy grave"])

    avg_imap = sum(e.imap_score for e in evaluations) / total if total > 0 else 0.0
    avg_igap = sum(e.igap_score for e in evaluations) / total if total > 0 else 0.0
    avg_neap = sum(e.neap for e in evaluations) / total if total > 0 else 0.0

    return {
        "total_evaluations": total,
        "risk_distribution": {
            "leve": leve,
            "medio": medio,
            "grave": grave,
            "leve_pct": round((leve / total) * 100, 1) if total > 0 else 0.0,
            "medio_pct": round((medio / total) * 100, 1) if total > 0 else 0.0,
            "grave_pct": round((grave / total) * 100, 1) if total > 0 else 0.0,
        },
        "averages": {
            "imap": round(avg_imap, 2),
            "igap": round(avg_igap, 2),
            "neap": round(avg_neap, 2),
        }
    }


def serialize_stage(stage: SurveyStage, all_evaluations: list[Evaluation]):
    # Evaluaciones vinculadas directamente por stage_id o realizadas dentro de su rango de fechas
    stage_evals = [
        e for e in all_evaluations
        if e.stage_id == stage.id or (
            e.stage_id is None
            and e.created_at is not None
            and stage.start_date <= e.created_at.date() <= stage.end_date
        )
    ]
    metrics = compute_evaluations_metrics(stage_evals)
    completed = metrics["total_evaluations"]
    target = stage.target_applications or 1
    sample_fulfilled = completed >= target
    completion_pct = round((completed / target) * 100, 1) if target > 0 else 0.0

    today = date.today()
    in_date_range = stage.start_date <= today <= stage.end_date
    apply_to_all = getattr(stage, "apply_to_all", True)
    if apply_to_all is None:
        apply_to_all = True
    target_dep = getattr(stage, "target_dependencia", None)
    approval_status = getattr(stage, "approval_status", "approved") or "approved"
    requested_by = getattr(stage, "requested_by", None)

    return {
        "id": stage.id,
        "year": stage.start_date.year,
        "instrument_name": stage.instrument_name,
        "start_date": stage.start_date.isoformat(),
        "end_date": stage.end_date.isoformat(),
        "period_label": f"{stage.start_date.isoformat()} al {stage.end_date.isoformat()}",
        "target_applications": target,
        "completed_applications": completed,
        "completion_pct": completion_pct,
        "sample_fulfilled": sample_fulfilled,
        "apply_to_all": bool(apply_to_all),
        "target_dependencia": target_dep if not apply_to_all else None,
        "scope_label": "Todos los usuarios" if apply_to_all else (target_dep or "Dependencia específica"),
        "approval_status": approval_status,
        "requested_by": requested_by,
        "is_active": stage.is_active,
        "is_currently_open": bool(stage.is_active and approval_status == "approved" and in_date_range),
        "averages": metrics["averages"],
        "risk_distribution": metrics["risk_distribution"],
        "created_at": stage.created_at.isoformat() if stage.created_at else None,
    }


@app.post("/api/login")
def login(data: LoginData, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(username=data.username).first()

    if user and verify_password(data.password, user.password_hash):
        respondent = db.query(Respondent).filter_by(user_id=user.id).first()
        respondent_id = respondent.id if respondent else None

        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'respondent_id': respondent_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")

        return {
            "token": token,
            "role": user.role,
            "respondent_id": respondent_id,
            "message": "Login successful"
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")


def stage_matches_respondent(stage: SurveyStage, respondent: Optional[Respondent]) -> bool:
    approval_status = getattr(stage, "approval_status", "approved") or "approved"
    if approval_status != "approved":
        return False
    apply_all = getattr(stage, "apply_to_all", True)
    if apply_all is None or apply_all:
        return True
    target_dep = (getattr(stage, "target_dependencia", None) or "").strip().lower()
    if not target_dep:
        return True
    if not respondent:
        return False
    user_fields = [
        (respondent.dependencia or "").strip().lower(),
        (respondent.coordinacion or "").strip().lower(),
        (respondent.departamento or "").strip().lower(),
        f"{(respondent.dependencia or '').strip()} — {(respondent.coordinacion or '').strip()}".lower(),
    ]
    return target_dep in user_fields


@app.get("/api/stages/active")
def get_active_stage(
    instrument_name: str = "Barómetro de Cisneros",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    respondent = db.query(Respondent).filter_by(user_id=current_user.id).first()
    stages = (
        db.query(SurveyStage)
        .filter(
            SurveyStage.instrument_name == instrument_name,
            SurveyStage.is_active == True,
            SurveyStage.start_date <= today,
            SurveyStage.end_date >= today
        )
        .order_by(SurveyStage.created_at.desc())
        .all()
    )

    matching_stages = [s for s in stages if stage_matches_respondent(s, respondent)]
    if not matching_stages:
        return {"active": False, "stage": None}

    active_stage = matching_stages[0]
    apply_all = getattr(active_stage, "apply_to_all", True)
    target_dep = getattr(active_stage, "target_dependencia", None)
    return {
        "active": True,
        "stage": {
            "id": active_stage.id,
            "instrument_name": active_stage.instrument_name,
            "start_date": active_stage.start_date.isoformat(),
            "end_date": active_stage.end_date.isoformat(),
            "target_applications": active_stage.target_applications,
            "apply_to_all": bool(apply_all),
            "target_dependencia": target_dep if not apply_all else None,
        }
    }


@app.post("/api/Cuestionario-cisneros")
def submit_evaluation(
    data: SubmitQuestionsData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    respondent = None
    if data.respondent_id is not None:
        respondent = db.query(Respondent).filter_by(id=data.respondent_id).first()
    if not respondent:
        respondent = db.query(Respondent).filter_by(user_id=current_user.id).first()
    if not respondent:
        raise HTTPException(status_code=404, detail="No se encontró el perfil de encuestado asociado al usuario")

    today = date.today()
    open_stages = (
        db.query(SurveyStage)
        .filter(
            SurveyStage.instrument_name == "Barómetro de Cisneros",
            SurveyStage.is_active == True,
            SurveyStage.start_date <= today,
            SurveyStage.end_date >= today
        )
        .order_by(SurveyStage.created_at.desc())
        .all()
    )

    matching_stages = [s for s in open_stages if stage_matches_respondent(s, respondent)]
    active_stage = matching_stages[0] if matching_stages else None

    if not active_stage:
        raise HTTPException(
            status_code=403,
            detail="No hay una etapa de evaluación habilitada y vigente para tu dependencia en la fecha actual."
        )

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

    # Guardar evaluación vinculada a la etapa activa
    evaluation = Evaluation(
        respondent_id=respondent.id,
        stage_id=active_stage.id,
        anonimo=data.anonimo,
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
        role="user",
        num_empleado=str(data.num_empleado)
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
def get_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    evaluations = db.query(Evaluation).all()
    metrics = compute_evaluations_metrics(evaluations)

    return {
        "total_evaluations": metrics["total_evaluations"],
        "risk_distribution": {
            "leve": metrics["risk_distribution"]["leve"],
            "medio": metrics["risk_distribution"]["medio"],
            "grave": metrics["risk_distribution"]["grave"]
        },
        "averages": {
            "imap": metrics["averages"]["imap"],
            "igap": metrics["averages"]["igap"]
        }
    }


@app.post("/api/superadmin/stages")
def create_survey_stage(
    data: CreateStageData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    new_stage = SurveyStage(
        instrument_name=data.instrument_name,
        start_date=data.start_date,
        end_date=data.end_date,
        target_applications=data.target_applications,
        apply_to_all=data.apply_to_all,
        target_dependencia=None if data.apply_to_all else data.target_dependencia,
        approval_status="approved",
        requested_by=current_user.username,
        is_active=data.is_active
    )
    db.add(new_stage)
    db.commit()
    db.refresh(new_stage)

    all_evaluations = db.query(Evaluation).all()
    return {
        "message": "Etapa de cuestionario creada exitosamente",
        "stage": serialize_stage(new_stage, all_evaluations)
    }


@app.patch("/api/superadmin/stages/{stage_id}/approval")
def review_survey_stage(
    stage_id: int,
    data: ApprovalActionData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    stage = db.query(SurveyStage).filter_by(id=stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Etapa no encontrada")

    if data.action == "approve":
        stage.approval_status = "approved"
        stage.is_active = True
        msg = "Etapa aprobada y habilitada exitosamente"
    else:
        stage.approval_status = "rejected"
        stage.is_active = False
        msg = "Solicitud de etapa rechazada"

    db.commit()
    db.refresh(stage)

    all_evaluations = db.query(Evaluation).all()
    return {
        "message": msg,
        "stage": serialize_stage(stage, all_evaluations)
    }


@app.post("/api/admin/stages")
def create_admin_survey_stage(
    data: CreateAdminStageData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    admin_dep = get_admin_dependencia(current_user, db)
    is_super = current_user.role == "superadmin"

    new_stage = SurveyStage(
        instrument_name=data.instrument_name,
        start_date=data.start_date,
        end_date=data.end_date,
        target_applications=data.target_applications,
        apply_to_all=False,
        target_dependencia=admin_dep,
        approval_status="approved" if is_super else "pending",
        requested_by=current_user.username,
        is_active=True if is_super else False
    )
    db.add(new_stage)
    db.commit()
    db.refresh(new_stage)

    all_evaluations = db.query(Evaluation).all()
    return {
        "message": (
            "Etapa creada y enviada para aprobación del Superadministrador"
            if not is_super
            else "Etapa creada y aprobada exitosamente"
        ),
        "stage": serialize_stage(new_stage, all_evaluations)
    }


@app.get("/api/admin/overview")
def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    admin_dep = get_admin_dependencia(current_user, db)

    all_users = db.query(User).all()
    all_respondents = db.query(Respondent).order_by(Respondent.id.desc()).all()
    all_evaluations = db.query(Evaluation).order_by(Evaluation.created_at.desc()).all()
    all_stages = db.query(SurveyStage).order_by(SurveyStage.start_date.desc(), SurveyStage.id.desc()).all()

    user_by_id = {u.id: u for u in all_users}
    stage_by_id = {s.id: s for s in all_stages}

    # Filtrar encuestados exclusivamente de la dependencia del administrador
    dep_respondents = [
        r for r in all_respondents
        if respondent_belongs_to_dependencia(r, admin_dep)
    ]
    dep_respondent_by_id = {r.id: r for r in dep_respondents}

    # Filtrar evaluaciones exclusivamente de los usuarios de esa dependencia
    dep_evaluations = [
        ev for ev in all_evaluations
        if ev.respondent_id in dep_respondent_by_id
    ]

    eval_count_by_respondent = {}
    for ev in dep_evaluations:
        eval_count_by_respondent[ev.respondent_id] = eval_count_by_respondent.get(ev.respondent_id, 0) + 1

    # 3. Tabla de datos personales de los usuarios de su dependencia
    users_table = []
    for r in dep_respondents:
        u = user_by_id.get(r.user_id)
        count_evals = eval_count_by_respondent.get(r.id, 0)
        users_table.append({
            "respondent_id": r.id,
            "user_id": r.user_id,
            "username": u.username if u else "—",
            "num_empleado": u.num_empleado if u and u.num_empleado else "—",
            "nombres": r.nombres,
            "apellido_p": r.apellido_p,
            "apellido_m": r.apellido_m,
            "nombre_completo": f"{r.nombres} {r.apellido_p} {r.apellido_m}".strip(),
            "curp": r.curp,
            "dependencia": r.dependencia,
            "coordinacion": r.coordinacion,
            "departamento": r.departamento,
            "puesto": r.puesto,
            "cargo": r.cargo or "—",
            "has_answered": count_evals > 0,
            "evaluations_count": count_evals,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    # 4. Tabla de resultados nominales (ocultando nombre y número de empleado si marcó anónimo)
    evaluations_table = []
    for ev in dep_evaluations:
        r = dep_respondent_by_id.get(ev.respondent_id)
        u = user_by_id.get(r.user_id) if r else None
        st = stage_by_id.get(ev.stage_id) if ev.stage_id else None
        is_anon = bool(ev.anonimo)

        evaluations_table.append({
            "evaluation_id": ev.id,
            "respondent_id": None if is_anon else ev.respondent_id,
            "num_empleado": "Anónimo" if is_anon else (u.num_empleado if u and u.num_empleado else "—"),
            "username": "Anónimo" if is_anon else (u.username if u else "—"),
            "nombre_completo": "Anónimo" if is_anon else (f"{r.nombres} {r.apellido_p} {r.apellido_m}".strip() if r else "—"),
            "curp": "Anónimo" if is_anon else (r.curp if r else "—"),
            "dependencia": r.dependencia if r else admin_dep,
            "coordinacion": r.coordinacion if r else "—",
            "departamento": r.departamento if r else "—",
            "puesto": r.puesto if r else "—",
            "cargo": r.cargo if r and r.cargo else "—",
            "anonimo": is_anon,
            "autor_acoso": ev.autor_acoso,
            "neap": ev.neap,
            "imap_score": round(ev.imap_score, 2),
            "igap_score": round(ev.igap_score, 2),
            "risk_level": ev.risk_level,
            "stage_id": ev.stage_id,
            "instrument_name": st.instrument_name if st else "Barómetro de Cisneros",
            "stage_period": f"{st.start_date.isoformat()} al {st.end_date.isoformat()}" if st else "Sin etapa asignada",
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        })

    # 5. Tabla general y distribución de riesgo de su dependencia, separada por departamentos
    dep_metrics = compute_evaluations_metrics(dep_evaluations)

    deptos_map = {}
    for r in dep_respondents:
        depto_name = (r.departamento or "Sin departamento").strip()
        coord_name = (r.coordinacion or "General").strip()
        if depto_name not in deptos_map:
            deptos_map[depto_name] = {
                "departamento": depto_name,
                "coordinacion": coord_name,
                "dependencia": r.dependencia or admin_dep,
                "respondents_count": 0,
                "evaluations": []
            }
        deptos_map[depto_name]["respondents_count"] += 1

    for ev in dep_evaluations:
        r = dep_respondent_by_id.get(ev.respondent_id)
        depto_name = (r.departamento if r and r.departamento else "Sin departamento").strip()
        coord_name = (r.coordinacion if r and r.coordinacion else "General").strip()
        if depto_name not in deptos_map:
            deptos_map[depto_name] = {
                "departamento": depto_name,
                "coordinacion": coord_name,
                "dependencia": r.dependencia if r else admin_dep,
                "respondents_count": 0,
                "evaluations": []
            }
        deptos_map[depto_name]["evaluations"].append(ev)

    risk_by_departamento = []
    total_meta_deptos = 0
    for depto_key, depto_info in deptos_map.items():
        m = compute_evaluations_metrics(depto_info["evaluations"])
        contestadas = m["total_evaluations"]
        meta_depto = max(depto_info["respondents_count"], contestadas)
        total_meta_deptos += meta_depto

        risk_by_departamento.append({
            "departamento": depto_info["departamento"],
            "coordinacion": depto_info["coordinacion"],
            "dependencia": depto_info["dependencia"],
            "meta_evaluaciones": meta_depto,
            "contestadas": contestadas,
            "leve": m["risk_distribution"]["leve"],
            "medio": m["risk_distribution"]["medio"],
            "grave": m["risk_distribution"]["grave"],
            "imap": m["averages"]["imap"],
            "igap": m["averages"]["igap"],
            "neap": m["averages"]["neap"],
        })

    # 2. Etapas aplicables a la dependencia del administrador (globales o asignadas a su dependencia)
    admin_dep_norm = admin_dep.strip().lower()
    dep_stages = [
        s for s in all_stages
        if getattr(s, "apply_to_all", True)
        or (getattr(s, "target_dependencia", None) or "").strip().lower() == admin_dep_norm
    ]
    serialized_dep_stages = [serialize_stage(s, dep_evaluations) for s in dep_stages]

    return {
        "role": current_user.role,
        "dependencia": admin_dep,
        "summary": {
            "total_respondents": len(dep_respondents),
            "total_evaluations": len(dep_evaluations),
            "total_stages": len(serialized_dep_stages),
        },
        "users_table": users_table,
        "evaluations_table": evaluations_table,
        "risk_overview": {
            "dependencia": admin_dep,
            "total_evaluations": dep_metrics["total_evaluations"],
            "total_meta_evaluaciones": total_meta_deptos,
            "total_departamentos": len(risk_by_departamento),
            "risk_distribution": dep_metrics["risk_distribution"],
            "averages": dep_metrics["averages"],
            "by_departamento": risk_by_departamento,
        },
        "stages": serialized_dep_stages,
        "available_instruments": [
            "Barómetro de Cisneros"
        ]
    }


@app.patch("/api/superadmin/stages/{stage_id}/toggle")
def toggle_survey_stage(
    stage_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    stage = db.query(SurveyStage).filter_by(id=stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Etapa no encontrada")

    stage.is_active = not stage.is_active
    db.commit()
    db.refresh(stage)

    all_evaluations = db.query(Evaluation).all()
    return {
        "message": "Estado de la etapa actualizado",
        "stage": serialize_stage(stage, all_evaluations)
    }


@app.get("/api/superadmin/stages")
def list_survey_stages(
    year: Optional[int] = None,
    instrument_name: Optional[str] = None,
    stage_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    stages = db.query(SurveyStage).order_by(SurveyStage.start_date.desc(), SurveyStage.id.desc()).all()
    all_evaluations = db.query(Evaluation).all()

    serialized = [serialize_stage(s, all_evaluations) for s in stages]

    if year is not None:
        serialized = [s for s in serialized if s["year"] == year]
    if instrument_name:
        serialized = [s for s in serialized if s["instrument_name"] == instrument_name]
    if stage_id is not None:
        serialized = [s for s in serialized if s["id"] == stage_id]

    return {"stages": serialized}


@app.get("/api/superadmin/overview")
def get_superadmin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin)
):
    users = db.query(User).all()
    respondents = db.query(Respondent).order_by(Respondent.id.desc()).all()
    evaluations = db.query(Evaluation).order_by(Evaluation.created_at.desc()).all()
    stages = db.query(SurveyStage).order_by(SurveyStage.start_date.desc(), SurveyStage.id.desc()).all()

    user_by_id = {u.id: u for u in users}
    respondent_by_id = {r.id: r for r in respondents}
    stage_by_id = {s.id: s for s in stages}

    eval_count_by_respondent = {}
    for ev in evaluations:
        eval_count_by_respondent[ev.respondent_id] = eval_count_by_respondent.get(ev.respondent_id, 0) + 1

    # 1. Tabla de datos personales de los usuarios
    users_table = []
    for r in respondents:
        u = user_by_id.get(r.user_id)
        count_evals = eval_count_by_respondent.get(r.id, 0)
        users_table.append({
            "respondent_id": r.id,
            "user_id": r.user_id,
            "username": u.username if u else "—",
            "num_empleado": u.num_empleado if u and u.num_empleado else "—",
            "nombres": r.nombres,
            "apellido_p": r.apellido_p,
            "apellido_m": r.apellido_m,
            "nombre_completo": f"{r.nombres} {r.apellido_p} {r.apellido_m}".strip(),
            "curp": r.curp,
            "dependencia": r.dependencia,
            "coordinacion": r.coordinacion,
            "departamento": r.departamento,
            "puesto": r.puesto,
            "cargo": r.cargo or "—",
            "has_answered": count_evals > 0,
            "evaluations_count": count_evals,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    # 2. Tabla de resultados de los usuarios que ya respondieron (Superadmin ve identidad completa aunque sea anónimo)
    evaluations_table = []
    for ev in evaluations:
        r = respondent_by_id.get(ev.respondent_id)
        u = user_by_id.get(r.user_id) if r else None
        st = stage_by_id.get(ev.stage_id) if ev.stage_id else None

        evaluations_table.append({
            "evaluation_id": ev.id,
            "respondent_id": ev.respondent_id,
            "num_empleado": u.num_empleado if u and u.num_empleado else "—",
            "username": u.username if u else "—",
            "nombre_completo": f"{r.nombres} {r.apellido_p} {r.apellido_m}".strip() if r else "—",
            "curp": r.curp if r else "—",
            "dependencia": r.dependencia if r else "—",
            "coordinacion": r.coordinacion if r else "—",
            "departamento": r.departamento if r else "—",
            "puesto": r.puesto if r else "—",
            "cargo": r.cargo if r and r.cargo else "—",
            "anonimo": ev.anonimo,
            "autor_acoso": ev.autor_acoso,
            "neap": ev.neap,
            "imap_score": round(ev.imap_score, 2),
            "igap_score": round(ev.igap_score, 2),
            "risk_level": ev.risk_level,
            "stage_id": ev.stage_id,
            "instrument_name": st.instrument_name if st else "Barómetro de Cisneros",
            "stage_period": f"{st.start_date.isoformat()} al {st.end_date.isoformat()}" if st else "Sin etapa asignada",
            "created_at": ev.created_at.isoformat() if ev.created_at else None,
        })

    # 3. Tabla general de riesgo y conteo de distribución de riesgo
    global_metrics = compute_evaluations_metrics(evaluations)

    # Desglose de riesgo por Área (Dependencia / Dirección o Subdirección)
    areas_map = {}
    for r in respondents:
        dep = (r.dependencia or "Sin dependencia").strip()
        coord = (r.coordinacion or "General").strip()
        area_key = f"{dep} || {coord}"
        if area_key not in areas_map:
            areas_map[area_key] = {
                "dependencia": dep,
                "coordinacion": coord,
                "area_label": f"{dep} — {coord}" if coord and coord != dep else dep,
                "respondents_count": 0,
                "evaluations": []
            }
        areas_map[area_key]["respondents_count"] += 1

    for ev in evaluations:
        r = respondent_by_id.get(ev.respondent_id)
        dep = (r.dependencia if r and r.dependencia else "Sin especificar").strip()
        coord = (r.coordinacion if r and r.coordinacion else "General").strip()
        area_key = f"{dep} || {coord}"
        if area_key not in areas_map:
            areas_map[area_key] = {
                "dependencia": dep,
                "coordinacion": coord,
                "area_label": f"{dep} — {coord}" if coord and coord != dep else dep,
                "respondents_count": 0,
                "evaluations": []
            }
        areas_map[area_key]["evaluations"].append(ev)

    risk_by_dependencia = []
    total_meta_areas = 0
    for area_key, area_info in areas_map.items():
        area_evals = area_info["evaluations"]
        m = compute_evaluations_metrics(area_evals)
        contestadas = m["total_evaluations"]
        meta_area = max(area_info["respondents_count"], contestadas)
        total_meta_areas += meta_area

        risk_by_dependencia.append({
            "area": area_info["area_label"],
            "dependencia": area_info["dependencia"],
            "coordinacion": area_info["coordinacion"],
            "meta_evaluaciones": meta_area,
            "contestadas": contestadas,
            "total": contestadas,
            "leve": m["risk_distribution"]["leve"],
            "medio": m["risk_distribution"]["medio"],
            "grave": m["risk_distribution"]["grave"],
            "imap": m["averages"]["imap"],
            "igap": m["averages"]["igap"],
            "neap": m["averages"]["neap"],
        })

    serialized_stages = [serialize_stage(s, evaluations) for s in stages]

    default_dependencias = [
        "Dirección de Obras Públicas",
    ]

    return {
        "role": current_user.role,
        "summary": {
            "total_users": len(users),
            "total_respondents": len(respondents),
            "total_evaluations": len(evaluations),
            "total_stages": len(stages),
        },
        "users_table": users_table,
        "evaluations_table": evaluations_table,
        "risk_overview": {
            "total_evaluations": global_metrics["total_evaluations"],
            "total_meta_evaluaciones": total_meta_areas,
            "total_areas": len(risk_by_dependencia),
            "risk_distribution": global_metrics["risk_distribution"],
            "averages": global_metrics["averages"],
            "by_dependencia": risk_by_dependencia,
        },
        "stages": serialized_stages,
        "available_instruments": [
            "Barómetro de Cisneros"
        ],
        "available_dependencias": default_dependencias
    }


@app.get("/api/num-empleado/search")
def search_num_empleados(
    query: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if query:
        users = db.query(User).filter(
            User.num_empleado.ilike(f"%{query}%")
        ).all()
    else:
        users = db.query(User).all()

    return {
        "empleados": [
            {
                "num_empleado": user.num_empleado,
                "username": user.username,
                "id": user.id
            }
            for user in users
        ]
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
