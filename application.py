import os
from datetime import datetime

from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from collections import deque

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

USERS = {"channel1": []}
CHANNELS = {"channel1": deque([], maxlen=100)}

@app.route("/", methods=["GET", "POST"])
def login():
    return render_template("login.html")

@app.route("/index", methods=["GET", "POST"])
def index():
    return render_template("index.html")

@socketio.on("add channel")
def add_channel(data):
    new_channel = data["channel"]
    if not new_channel in CHANNELS.keys():
        CHANNELS[new_channel] = deque(maxlen=100)
        USERS[new_channel] = []
        emit('show channel', { "name" : new_channel}, broadcast=True)
        emit('local add channel', { "name" : new_channel})
    else:
        return False

@socketio.on('add msg')
def new_msg(info_msg):
    info_msg['time'] = str(datetime.today().replace(microsecond=0))
    CHANNELS[info_msg['channel']].append(info_msg)
    emit('show message', info_msg, broadcast=True)

@socketio.on('get channels')
def get_channels(data):
    if not data['name'] in list(CHANNELS.keys()):
        emit('first channel')
    else:
        emit('set chat')
        emit('channels', list(CHANNELS.keys()))
        emit('msg', list(CHANNELS[data['name']]))

        if not data['username'] in USERS[data['name']]:
            USERS[data['name']].append(data['username'])
        emit('online', {'users':USERS[data['name']], 'name':data['name']}, broadcast=True)


@socketio.on('get msg')
def get_msgs(channel):
    emit('msg', list(CHANNELS[channel['name']]))

@socketio.on('join')
def join_room(data):
    USERS[data['name']].append(data['username'])
    emit('online', {'users':USERS[data['name']], 'name':data['name']}, broadcast=True)

@socketio.on('leave')
def leave_room(data):
    for i in range(len(USERS[data['old_channel']])):
        if data['username'] == USERS[data['old_channel']][i]:
            USERS[data['old_channel']].pop(i)
            break
    emit('online', {'users':USERS[data['old_channel']], 'name':data['old_channel']}, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, use_reloader=True)
