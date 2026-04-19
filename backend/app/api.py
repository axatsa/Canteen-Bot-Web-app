import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import List, Optional
from . import schemas, crud
from .export import TEMPLATES_DIR, EXPORTS_DIR, ensure_dirs, fill_docx_template, build_export_context

app = FastAPI(title="Optimizer API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/products", response_model=List[schemas.Product])
async def get_products():
    return crud.get_all_products()

@app.get("/orders", response_model=List[schemas.Order])
async def get_orders():
    return crud.get_all_orders()

@app.post("/orders/upsert")
async def upsert_order(order: schemas.Order):
    success = crud.upsert_order(order.dict())
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save order")
    return {"status": "success"}

@app.post("/users/register")
async def register_user(user: schemas.UserRegister):
    success = crud.save_user(
        user.telegram_id, 
        user.full_name, 
        user.role, 
        user.branch, 
        user.language
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to register user")
    return {"status": "success"}

@app.get("/users/{telegram_id}")
async def get_user(telegram_id: int):
    user = crud.get_user_by_telegram_id(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Delivery tracking endpoints ────────────────────────────────────────────────

@app.post("/orders/{order_id}/mark_supplier_received")
async def mark_supplier_received(order_id: str, body: schemas.MarkSupplierReceivedRequest):
    order = crud.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    success = crud.mark_supplier_received(order_id, body.received_date)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update order")
    return {"status": "success", "order_id": order_id, "supplier_responded": True,
            "received_from_supplier_at": body.received_date}


@app.post("/orders/{order_id}/update_delivery")
async def update_delivery(order_id: str, body: schemas.UpdateDeliveryRequest):
    order = crud.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    tracking = {k: v.dict() for k, v in body.delivery_tracking.items()}
    success = crud.update_delivery_tracking(order_id, tracking, body.extra_items)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update delivery")
    return {"status": "success", "message": "Приёмка обновлена"}


@app.post("/orders/{order_id}/archive")
async def archive_order(order_id: str, body: schemas.ArchiveRequest):
    order = crud.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    success = crud.archive_order(order_id, body.archived_by)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to archive order")
    return {"status": "success", "order_id": order_id, "status_new": "archived"}


@app.get("/orders/financier/delivery_report")
async def financier_delivery_report(branch: Optional[str] = None):
    return crud.get_financier_delivery_report(branch)


@app.get("/orders/financier/all")
async def financier_all_orders(
    branch: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    return crud.get_financier_all_orders(branch, status, limit, offset)


@app.get("/orders/financier/statistics")
async def financier_statistics(branch: Optional[str] = None):
    return crud.get_financier_statistics(branch)


@app.get("/orders/financier/archive")
async def financier_archive(
    branch: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    return crud.get_financier_archive(branch, limit, offset)


@app.get("/orders/{order_id}/financier/details")
async def order_financier_details(order_id: str):
    details = crud.get_order_financier_details(order_id)
    if not details:
        raise HTTPException(status_code=404, detail="Order not found")
    return details


# ── Template endpoints ─────────────────────────────────────────────────────────

@app.post("/templates/upload")
async def upload_template(
    file: UploadFile = File(...),
    template_name: str = Form(...),
    description: str = Form(""),
):
    ensure_dirs()
    if not file.filename.endswith('.docx'):
        raise HTTPException(status_code=400, detail="Only .docx files are allowed")
    if crud.get_all_templates().__len__() >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 templates allowed")

    import uuid as _uuid
    file_id = _uuid.uuid4().hex
    save_path = os.path.join(TEMPLATES_DIR, f"{file_id}.docx")
    content = await file.read()
    with open(save_path, 'wb') as f:
        f.write(content)

    tid = crud.save_template(template_name, description, save_path, len(content))
    if not tid:
        raise HTTPException(status_code=500, detail="Failed to save template")

    return {"template_id": tid, "name": template_name, "file_path": save_path}


@app.get("/templates/list")
async def list_templates():
    templates = crud.get_all_templates()
    return {"templates": [
        {
            "template_id": t['id'],
            "name": t['name'],
            "description": t.get('description'),
            "uploaded_at": t.get('created_at', ''),
            "file_size": t.get('file_size'),
        }
        for t in templates
    ]}


@app.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    success = crud.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "success", "message": "Шаблон удален"}


@app.post("/orders/{order_id}/export/template")
async def export_order_template(order_id: str, body: schemas.ExportTemplateRequest):
    details = crud.get_order_financier_details(order_id)
    if not details:
        raise HTTPException(status_code=404, detail="Order not found")

    templates = crud.get_all_templates()
    template = next((t for t in templates if t['id'] == body.template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    context = build_export_context(details)
    out_path = fill_docx_template(template['file_path'], context)
    if not out_path:
        raise HTTPException(status_code=500, detail="Failed to generate document")

    file_name = os.path.basename(out_path)
    return FileResponse(
        path=out_path,
        filename=file_name,
        media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
