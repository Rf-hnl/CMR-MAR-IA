import json
import requests
from datetime import datetime

# ------------------------------------------------------
# CARGA DE PRECIOS DESDE ARCHIVO JSON
# ------------------------------------------------------

with open("precios.json", "r", encoding="utf-8") as f:
    PRECIOS = json.load(f)

# ------------------------------------------------------
# CONFIGURACIÓN GENERAL
# ------------------------------------------------------

API_KEY = "b312bd6063d6a1b3d6b26a3459e64f3c27c0e39b"
TEMPLATE_UUID = "LYQ6gaCxbd6LUsgA6uskED"
PRICING_TABLE_NAME = "antares_table"

CLIENTE = "JUMBO"
CORREO_CLIENTE = "contJUMBOacto@hnl.com"

PRODUCTOS = [
    {"name": "Hiopos Punto de venta", "cantidad": 2, "descuento": 7, "Text": "Unico"},
    {"name": "TPV Hiopos SUN II con doble pantalla", "cantidad": 1, "descuento": 7, "Text": "Unico"},
    {"name": "Retail Mobile", "cantidad": 1, "descuento": 5, "Text": "unico"},
    {"name": "HiOffice Lite", "cantidad": 2, "descuento": 0, "Text": "Mensual"},
    {"name": "Ecommerce Lite", "cantidad": 1, "descuento": 0, "Text": "Mensual"},
    {"name": "TPV Hiopos SUN con impresora integrada - Single", "cantidad": 1, "descuento": 7, "Text": "Unico"},
    {"name": "Ecommerce Web", "cantidad": 2, "descuento": 0, "Text": "Mensual"},
    {"name": "HiOffice Gold", "cantidad": 21, "descuento": 0, "Text": "Mensual"},
    {"name": "Bridge Webservice Gold mas de 500 establecimientos", "cantidad": 1, "descuento": 0, "Text": "Mensual"},
]

# ------------------------------------------------------
# FUNCIÓN PRINCIPAL DE COTIZACIÓN
# ------------------------------------------------------

def generar_payload(cliente, correo, productos):
    rows = []
    total_lista = 0
    total_descuento = 0
    pago_unico_total = 0
    pago_mensual_total = 0

    for p in productos:
        precio_unitario = PRECIOS[p["name"]]
        cantidad = p["cantidad"]
        descuento = p["descuento"]
        tipo_pago = p.get("Text", "").lower()

        subtotal = precio_unitario * cantidad
        descuento_valor = (precio_unitario * descuento / 100) * cantidad
        precio_con_descuento = precio_unitario - (precio_unitario * descuento / 100)
        precio_final = precio_con_descuento * cantidad

        total_lista += subtotal
        total_descuento += descuento_valor

        if tipo_pago == "unico":
            pago_unico_total += precio_final
        elif tipo_pago == "mensual":
            pago_mensual_total += precio_final

        row = {
            "data": {
                "Name": p["name"],
                "Description": f"Cantidad: {cantidad}",
                "Price": round(precio_unitario, 2),  # PRECIO BASE
                "QTY": cantidad,
                "Discount": {
                    "type": "percent",
                    "value": descuento
                },
                "Tax": {
                    "type": "percent",
                    "value": 7
                }
            },
            "options": {
                "optional": False,
                "optional_selected": True,
                "qty_editable": False
            },
            "custom_fields": {
                "Text": p.get("Text", "")
            }
        }
        rows.append(row)

    # Cálculo de totales
    total_impuestos = (pago_unico_total + pago_mensual_total) * 0.07
    total_final = total_lista - total_descuento + total_impuestos

    pago_unico_total_con_impuesto = pago_unico_total * 1.07
    pago_unico_50_1 = pago_unico_total_con_impuesto / 2
    pago_unico_50_2 = pago_unico_total_con_impuesto / 2

    pago_mensual_total_con_impuesto = pago_mensual_total * 1.07

    return {
        "name": f"Quotation - {cliente} - {datetime.today().strftime('%B %Y')}",
        "template_uuid": TEMPLATE_UUID,
        "recipients": [
            {
                "email": correo,
                "first_name": cliente,
                "last_name": "",
            }
        ],
        "fields": {
            "client_name": { "value": cliente },
            "date": { "value": datetime.today().strftime("%d/%m/%Y") },
            "total": { "value": round(total_final, 2) },
            "total_lista": { "value": round(total_lista, 2) },
            "total_descuento": { "value": round(total_descuento, 2) }
        },
        "tokens": [
            { "name": "client", "value": cliente },
            { "name": "Client.FirstName", "value": cliente },
            { "name": "cliente.Email", "value": correo },
            { "name": "Client.City", "value": "Panama City" },
            { "name": "Sender.FirstName", "value": "María" },
            { "name": "Sender.LastName", "value": "Montes" },
            { "name": "Sender.Company", "value": "HypernovLabs" },
            { "name": "date", "value": datetime.today().strftime("%d/%m/%Y") },

            { "name": "total", "value": round(total_final, 2) },
            { "name": "total_lista", "value": round(total_lista, 2) },
            { "name": "total_descuento", "value": round(total_descuento, 2) },
            { "name": "impuestos", "value": round(total_impuestos, 2) },
            { "name": "antares_table.Tax", "value": round(total_impuestos, 2) },

            { "name": "Total.Pagounico", "value": round(pago_unico_total_con_impuesto, 2) },
            { "name": "PagoUnico.50_1", "value": round(pago_unico_50_1, 2) },
            { "name": "PagoUnico.50_2", "value": round(pago_unico_50_2, 2) },

            { "name": "Total.Pagomensual", "value": round(pago_mensual_total_con_impuesto, 2) },

            { "name": "document_name", "value": f"Quotation - {cliente} - {datetime.today().strftime('%B %Y')}" }
        ],
        "pricing_tables": [
            {
                "name": PRICING_TABLE_NAME,
                "data_merge": True,
                "options": {},
                "sections": [
                    {
                        "title": "Antares Tech - Cotización personalizada",
                        "default": True,
                        "rows": rows
                    }
                ]
            }
        ]
    }

# ------------------------------------------------------
# EJECUCIÓN
# ------------------------------------------------------

if __name__ == "__main__":
    payload = generar_payload(CLIENTE, CORREO_CLIENTE, PRODUCTOS)

    response = requests.post(
        url="https://api.pandadoc.com/public/v1/documents",
        headers={
            "Authorization": f"API-Key {API_KEY}",
            "Content-Type": "application/json"
        },
        json=payload
    )

    if response.status_code in [200, 201]:
        doc_id = response.json().get("id", "")
        print("✅ Cotización enviada correctamente.")
        print(f"📄 Ver documento en PandaDoc: https://app.pandadoc.com/a/#/documents/{doc_id}")
    else:
        print("❌ Error al enviar la cotización:")
        print("Código:", response.status_code)
        print("Respuesta:", response.text)
