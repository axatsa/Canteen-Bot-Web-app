import os
import argparse
import uvicorn
import logging
import asyncio
from dotenv import load_dotenv
from app.database import init_db, seed_db
from app.api import app
from app.bot import get_bot_handler
from telegram.ext import Application
from telegram import Update

# Load env
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def run_bot():
    token = os.getenv('BOT_TOKEN')
    if not token:
        logger.error("BOT_TOKEN not set!")
        return
    
    application = Application.builder().token(token).build()
    application.add_handler(get_bot_handler())
    
    logger.info("Starting bot...")
    async with application:
        await application.initialize()
        await application.start()
        await application.updater.start_polling(allowed_updates=Update.ALL_TYPES)
        # Keep running
        while True:
            await asyncio.sleep(1)

def run_api():
    logger.info("Starting API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Optimizer Backend")
    parser.add_argument("mode", choices=["api", "bot", "both"], help="What to run")
    args = parser.parse_args()

    # Initialize DB
    init_db()
    seed_db()

    if args.mode == "api":
        run_api()
    elif args.mode == "bot":
        loop = asyncio.get_event_loop()
        loop.run_until_complete(run_bot())
    elif args.mode == "both":
        # Run API in a separate thread or just use a task
        # For simplicity in development, you might want to run them separately
        # But here's a way to run both in one process (not recommended for production but okay for here)
        from threading import Thread
        
        api_thread = Thread(target=run_api, daemon=True)
        api_thread.start()
        
        loop = asyncio.get_event_loop()
        loop.run_until_complete(run_bot())
