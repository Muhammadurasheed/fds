"""Development entry point for the Formation Damage Simulator API.

Usage:
    cd C:\\Users\\HP\\Documents\\FDS\\backend
    conda activate fds-api
    python run.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
