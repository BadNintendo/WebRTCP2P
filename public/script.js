/** CONFIG **/
let USE_AUDIO = true;
let USE_VIDEO = true;
const DEFAULT_CHANNEL = 'some-global-channel-name';
const MUTE_AUDIO_BY_DEFAULT = false;

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

let signaling_socket = null;
let local_media_stream = null;
let peers = {};
let peer_media_elements = {};

function init(room) {
  console.log('Connecting to signaling server');
  signaling_socket = io();
  removeStartScreen();
  addRoomID(room);
  signaling_socket.on('connect', () => {
    console.log('Connected to signaling server');
    setup_local_media(() => {
      join_chat_channel(room, {
        name: '',
      });
    });
  });
  signaling_socket.on('disconnect', () => {
    console.log('Disconnected from signaling server');
    for (peer_id in peer_media_elements) {
      peer_media_elements[peer_id].remove();
    }
    for (peer_id in peers) {
      peers[peer_id].close();
    }
    peers = {};
    peer_media_elements = {};
  });
  function join_chat_channel(channel, userdata) {
    signaling_socket.emit('join', { channel: channel, userdata: userdata });
  }
  function part_chat_channel(channel) {
    signaling_socket.emit('part', channel);
  }
  signaling_socket.on('addPeer', async config => {
    console.log('Signaling server said to add peer:', config);
    let peer_id = config.peer_id;
    if (peer_id in peers) {
      console.log(`Already connected to peer ${peer_id}`);
      return;
    }
    let peer_connection = new RTCPeerConnection(
      { iceServers: ICE_SERVERS },
      { optional: [{ DtlsSrtpKeyAgreement: true }] }
    );
    peers[peer_id] = peer_connection;
    peer_connection.onicecandidate = event => {
      if (event.candidate) {
        signaling_socket.emit('relayICECandidate', {
          peer_id: peer_id,
          ice_candidate: {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
          },
        });
      }
    };
    peer_connection.ontrack = event => {
      console.log('onTrack', event);
      if (event.track.kind === 'audio' && USE_VIDEO) return;
      let remote_media = USE_VIDEO
        ? document.createElement('video')
        : document.createElement('audio');
      remote_media.setAttribute('autoplay', 'true');
      remote_media.setAttribute('playsinline', 'true');
      if (MUTE_AUDIO_BY_DEFAULT) {
        remote_media.setAttribute('muted', 'true');
      }
      remote_media.setAttribute('controls', '')
      peer_media_elements[peer_id] = remote_media;;
      document.querySelector('body').append(remote_media);
      attachMediaStream(remote_media, event.streams[0]);
    };
    local_media_stream.getTracks().forEach(track => {
      peer_connection.addTrack(track, local_media_stream);
    });
    if (config.should_create_offer) {
      console.log(`Creating RTC offer to ${peer_id}`);
      peer_connection.createOffer().then(
        local_description => {
          console.log('Local offer description is:', local_description);
          peer_connection.setLocalDescription(local_description).then(() => {
            signaling_socket.emit('relaySessionDescription', {
              peer_id: peer_id,
              session_description: local_description,
            });
            console.log('Offer setLocalDescription succeeded');
          });
          //   peer_connection.setLocalDescription(
          //     local_description,
          //     () => {
          //       signaling_socket.emit('relaySessionDescription', {
          //         peer_id: peer_id,
          //         session_description: local_description,
          //       })
          //       console.log('Offer setLocalDescription succeeded')
          //     },
          //     () => {
          //       Alert('Offer setLocalDescription failed!')
          //     }
          //   )
        },
        error => {
          console.log('Error sending offer:', error);
        }
      );
    }
  });
  signaling_socket.on('sessionDescription', config => {
    console.log('Remote description received:', config);
    let peer_id = config.peer_id;
    let peer = peers[peer_id];
    let remote_description = config.session_description;
    console.log(config.session_description);
    let desc = new RTCSessionDescription(remote_description);
    let stuff = peer.setRemoteDescription(desc).then(
      () => {
        console.log('setRemoteDescription succeeded');
        if (remote_description.type == 'offer') {
          console.log('Creating answer');
          peer.createAnswer().then(
            local_description => {
              console.log('Answer description is:', local_description);
              peer.setLocalDescription(local_description).then(
                () => {
                  signaling_socket.emit('relaySessionDescription', {
                    peer_id: peer_id,
                    session_description: local_description,
                  });
                  console.log('Answer setLocalDescription succeeded');
                },
                () => {
                  Alert('Answer setLocalDescription failed!');
                }
              )
            },
            error => {
              console.log('Error creating answer:', error);
              console.log(peer);
            }
          )
        }
      },
      error => {
        console.log('setRemoteDescription error:', error);
      }
    );
    console.log('Description Object:', desc);
  });
  signaling_socket.on('iceCandidate', config => {
    let peer = peers[config.peer_id];
    let ice_candidate = config.ice_candidate;
    peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
  });
  signaling_socket.on('removePeer', config => {
    console.log('Signaling server said to remove peer:', config);
    let peer_id = config.peer_id;
    if (peer_id in peer_media_elements) {
      peer_media_elements[peer_id].remove();
    }
    if (peer_id in peers) {
      peers[peer_id].close();
    }
    delete peers[peer_id];
    delete peer_media_elements[config.peer_id];
  });
}
function setup_local_media(callback, errorback) {
  if (local_media_stream != null) {
    if (callback) callback();
    return;
  }
  /*console.log('Requesting access to local audio / video inputs');
  attachMediaStream = (element, stream) => {
    if (typeof element.srcObject == 'object') {
      element.srcObject = stream;
    } else {
      element.src = URL.createObjectURL(stream);
    }
  };
  navigator.mediaDevices
    .getUserMedia({ audio: USE_AUDIO, video: USE_VIDEO })
    .then(
      stream => {
        console.log('Access granted to audio/video');
        local_media_stream = stream;
        let local_media = USE_VIDEO
          ? document.createElement('video')
          : document.createElement('audio');
        local_media.setAttribute('autoplay', 'true');
        local_media.setAttribute('playsinline', 'true');
        local_media.muted = true;
        local_media.setAttribute('controls', '');
        document.querySelector('body').append(local_media);
        attachMediaStream(local_media, stream);

        if (callback) callback();
      },
      () => {
        console.log('Access denied for audio/video');
        alert('You chose not to provide access to the camera/microphone, demo will not work.');
        if (errorback) errorback();
      }
    );*/
}
function removeStartScreen() {
    document.getElementById('start-screen').style.display = 'none';
}

function getRoomID() {
    let room = document.getElementById('room').value;
    return room;
}
function addRoomID(ID) {
    let roomID = document.createElement('h1');
    roomID.innerHTML = `Room ID: ${ID}`;
    roomID.setAttribute('id', 'room-id');
    document.querySelector('body').append(roomID);
}
var onloaded = (room) => {
	init(room);
};
var sendroom = () => {
	window.location = '/room/' + getRoomID();
	return false;
};