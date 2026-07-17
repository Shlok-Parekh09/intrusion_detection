import gradio as gr
from src.api_server import app as fastapi_app

with gr.Blocks(title="Vortex SIEM Backend") as demo:
    gr.Markdown("# Vortex SIEM Backend")
    gr.Markdown("This Hugging Face Space hosts the FastAPI backend for the Vortex SIEM dashboard.")
    gr.Markdown("All REST endpoints are available under the `/api/v1/` path.")

# Mount the FastAPI app and Gradio interface together
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
