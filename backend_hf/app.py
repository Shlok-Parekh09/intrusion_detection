import gradio as gr
from src.api_server import app as fastapi_app

# Create a dummy Gradio interface to satisfy the Hugging Face Gradio SDK
demo = gr.Interface(
    fn=lambda: "VORTEX SIEM Backend is running live on CPU!",
    inputs=None,
    outputs="text",
    title="VORTEX SIEM Backend API"
)

# Mount the FastAPI app onto the Gradio interface
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
