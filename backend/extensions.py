# This file is no longer needed since db is in models.py
# But we'll keep it for other extensions

from flask_mail import Mail
from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt

mail = Mail()
socketio = SocketIO()
bcrypt = Bcrypt()