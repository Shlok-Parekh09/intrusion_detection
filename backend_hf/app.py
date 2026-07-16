import uvicorn
import spaces
from src.api_server import app

# ZeroGPU strict AST parser requirement
@spaces.GPU
def dummy_gpu():
    pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
