import pytest
from unittest.mock import AsyncMock, MagicMock
from telegram import Update, User, Message, Chat, CallbackQuery
from telegram.ext import ContextTypes
import src.bot.main as bot
from src.common.database.connection import init_db, seed_db
import src.common.database.connection as db_module

@pytest.fixture
def mock_update():
    update = MagicMock(spec=Update)
    update.effective_user = MagicMock(spec=User)
    update.effective_user.id = 12345
    update.effective_user.username = "testuser"
    update.effective_chat = MagicMock(spec=Chat)
    update.effective_chat.id = 12345
    update.effective_message = AsyncMock(spec=Message)
    update.callback_query = AsyncMock(spec=CallbackQuery)
    return update

@pytest.fixture
def mock_context():
    context = MagicMock(spec=ContextTypes.DEFAULT_TYPE)
    context.user_data = {}
    context.bot = AsyncMock()
    return context

@pytest.mark.asyncio
async def test_start_command_new_user(mock_update, mock_context, tmp_path, monkeypatch):
    # Setup test DB
    db_file = str(tmp_path / "test_bot.db")
    monkeypatch.setattr(db_module, "DB_PATH", db_file)
    init_db()
    
    # Run start handler
    result = await bot.start(mock_update, mock_context)
    
    # Verify response
    assert result == bot.LANGUAGE
    mock_update.effective_message.reply_text.assert_called_once()
    args, kwargs = mock_update.effective_message.reply_text.call_args
    assert "Добро пожаловать" in args[0]
    assert kwargs["reply_markup"] is not None

@pytest.mark.asyncio
async def test_language_selection(mock_update, mock_context):
    mock_update.callback_query.data = "lang_ru"
    
    result = await bot.language_selected(mock_update, mock_context)
    
    assert result == bot.FIO
    assert mock_context.user_data["language"] == "ru"
    mock_update.callback_query.answer.assert_called_once()
    mock_context.bot.send_message.assert_called_once()
    args, kwargs = mock_context.bot.send_message.call_args
    assert "Введите ваше ФИО" in kwargs["text"]

@pytest.mark.asyncio
async def test_fio_entered(mock_update, mock_context):
    mock_context.user_data["language"] = "ru"
    mock_update.message = MagicMock(spec=Message)
    mock_update.message.text = "Иванов Иван Иванович"
    
    result = await bot.fio_entered(mock_update, mock_context)
    
    assert result == bot.ROLE
    assert mock_context.user_data["full_name"] == "Иванов Иван Иванович"
    # It should send the role selection message
    args, kwargs = mock_update.message.reply_text.call_args_list[1] # second call after '⏳'
    assert "Выберите вашу роль" in args[0]
