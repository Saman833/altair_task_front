# FastAPI CORS Configuration Fix

## The Issue
Your FastAPI backend is missing CORS middleware, causing browser CORS errors when your frontend tries to access it.

## Quick Fix

Add this to your main FastAPI file (main.py or app.py):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add this BEFORE your router includes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://altairtaskfront-task.up.railway.app",  # Your frontend
        "http://localhost:3000",  # Local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Your existing routers here...
```

## Alternative (Less Secure)
For quick testing, allow all origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Steps
1. Add the CORS middleware to your backend
2. Redeploy your backend on Railway
3. Test your frontend - CORS errors should be gone!

## Your Backend Endpoints Look Good
Your `/contents/` and `/contents/{content_id}` endpoints are properly configured. 