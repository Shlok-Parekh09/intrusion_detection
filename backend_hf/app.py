import gradio as gr
from src.api_server import app as fastapi_app

with gr.Blocks(title="Vortex SIEM Backend") as demo:
    gr.Markdown("# Vortex SIEM Backend")
    gr.Markdown("This Hugging Face Space hosts the FastAPI backend for the Vortex SIEM dashboard.")
    gr.Markdown("All REST endpoints are available under the `/api/v1/` path.")

from fastapi.responses import HTMLResponse

@fastapi_app.get("/")
def read_root():
    return HTMLResponse("<h1>Vortex SIEM API</h1><p>REST API running successfully. Access Gradio UI at <a href='/ui'>/ui</a>.</p>")

# Mount the FastAPI app and Gradio interface together, but at /ui so it doesn't swallow /api/v1 routes!
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

