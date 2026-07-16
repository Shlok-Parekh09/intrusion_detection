import gradio as gr
import spaces
from src.api_server import app as fastapi_app

# The user created a ZeroGPU space instead of a CPU space!
# We must include a @spaces.GPU function or HF will crash on boot.
@spaces.GPU
def dummy_gpu_function():
    return "VORTEX SIEM Backend is running live!"

# Create a dummy Gradio interface to satisfy the Hugging Face Gradio SDK
demo = gr.Interface(
    fn=dummy_gpu_function,
    inputs=None,
    outputs="text",
    title="VORTEX SIEM Backend API"
)

# Mount the FastAPI app onto the Gradio interface
# This allows all /api/v1/* routes to work normally
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
