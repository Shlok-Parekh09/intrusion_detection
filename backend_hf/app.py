import uvicorn
import spaces
from src.api_server import app

# ZeroGPU strict AST parser requirement
@spaces.GPU
def dummy_gpu():
    pass

# Run unconditionally so the HF importer gets blocked and FastAPI serves on 7860!
uvicorn.run(app, host="0.0.0.0", port=7860)
