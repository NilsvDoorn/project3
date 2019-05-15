document.addEventListener("DOMContentLoaded", () => {

    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // When connected, configure buttons
    socket.on('connect', () => {
      socket.on("show channel", new_channel => {
        show_channel(new_channel.name, socket);
      });

      socket.on("local add channel", new_channel => {
        goto_channel(new_channel.name, socket);
      });

      socket.on("first channel", data => {
        localStorage.setItem('channel', 'channel1')
        name = 'channel1'
        socket.emit("get channels", { name });
      });

      socket.on("show message", data => {
        if (localStorage.getItem('channel') == data.channel){
          show_msgs(data, socket);
        }
      });

      socket.on("channels", data => {
        for (let c of data) {
          show_channel(c, socket);
        };
      });
      socket.on("set chat", data => {
        let chat_name = document.getElementById("chat_name");
        chat_name.innerHTML = `${localStorage.getItem("channel")}'s chat`
      });

      socket.on("msg", data => {
        let msg_list = document.querySelector("#msg-list");
        msg_list.innerHTML = "";
        for (let c of data) {
          show_msgs(c, socket);
        };
      });

      socket.on("online", data => {
        console.log("online")
        if (localStorage.getItem('channel') == data.name){
          let users_list = document.getElementById("users-list");
          users_list.innerHTML = "";
          for (user of data.users){
            show_online_users(user, socket);
          }
        }
      });
    });

    // get all channels when starting flask
    name = localStorage.getItem('channel')
    username = localStorage.getItem('username')
    socket.emit("get channels", { name, username });

    // Add new message to a channel
    document.querySelector('#add-channel').onclick = function(event) {
      event.preventDefault()
      const channel = strip(document.getElementById('channel-name').value)
      if (channel != ""){
        socket.emit('add channel', {'channel': channel});
        document.getElementById('channel-name').value = "";
      }
      else {
        document.getElementById('channel-name').value = "";
        return false;
      };
    };

    // Add message to channel in localStorage
    document.querySelector('#add-msg').onclick = function(event) {
      event.preventDefault()
      const message = strip(document.getElementById('msg').value)
      const channel = localStorage.getItem("channel")
      const username = localStorage.getItem("username")
      if (message != ""){
        socket.emit('add msg', {'channel': channel, 'msg': message, 'username':username});
        document.getElementById('msg').value = "";
      }
      else {
        document.getElementById('msg').value = "";
        return false;
      };
    };

    // Show a channel
    const show_channel = (name, socket) => {
      // grab ul that displays channels
      let channel_list = document.querySelector("#channel-list");
      let channel = document.createElement("li");

      channel.classList.add("list-group-item");
      channel.innerHTML = name;

      channel.addEventListener("click", () => {
        let chat_name = document.getElementById("chat_name");
        let username = localStorage.getItem('username')
        let old_channel = localStorage.getItem('channel')
        socket.emit("leave", { old_channel, username })
        chat_name.innerHTML = `${name}'s chat`

        localStorage.setItem("channel", name);
        socket.emit("get msg", { name });
        socket.emit("join", { name, username })
      });
      channel_list.appendChild(channel);
    };

    const goto_channel = (name, socket) => {
      let old_channel = localStorage.getItem('channel')
      socket.emit("leave", { old_channel, username })
      localStorage.setItem("channel", name);
      let msg_list = document.querySelector("#msg-list");
      msg_list.innerHTML = "";
      let chat_name = document.getElementById("chat_name");
      chat_name.innerHTML = `${name}'s chat`;
    }

    // Show all msg's from channel
    const show_msgs = (info_msg, socket) => {

      // grab ul that displays msg
      let msg_list = document.getElementById("msg-list");
      let msg = document.createElement("li");

      msg.classList.add("list-group-item");
      msg.innerHTML = `${info_msg.username}: ${info_msg.msg} <small class="text-muted d-flex justify-content-end">${info_msg.time}</small>`;
      msg_list.appendChild(msg);
    };

    // show online people
    const show_online_users = (data, socket) => {
      let users_list = document.getElementById("users-list");
      let user = document.createElement("li");

      user.classList.add("list-group-item");
      user.innerHTML = `${data}`;
      users_list.appendChild(user);
    };
});
