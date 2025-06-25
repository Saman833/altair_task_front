from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from your_routers import router  # Import your existing router
import os

app = FastAPI()

# Get frontend URL from environment variable
frontendURL = os.getenv("FRONT_URL", "https://message-manager-dev.up.railway.app/")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontendURL,  # Your frontend URL
        "http://localhost:3000",  # For local development
        "http://localhost:3001",  # Alternative local port
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include your existing router
app.include_router(router)

# Your existing code continues here... 