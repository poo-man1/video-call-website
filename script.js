let localStream;
let peerConnection;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
const socket = new WebSocket(location.origin.replace(/^http/, 'ws'));

socket.onmessage = async (msg) => {
  const data = JSON.parse(msg.data);
  if (data.offer) {
    await setupPeer();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ answer }));
  } else if (data.answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  } else if (data.candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  } else if (data.chat) {
    document.getElementById('messages').innerHTML += `<div><b>Stranger:</b> ${data.chat}</div>`;
  }
};

async function setupPeer() {
  peerConnection = new RTCPeerConnection(config);
  peerConnection.onicecandidate = (e) => {
    if (e.candidate) socket.send(JSON.stringify({ candidate: e.candidate }));
  };
  peerConnection.ontrack = (e) => {
    document.getElementById('remoteVideo').srcObject = e.streams[0];
  };
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });
}

async function startChat() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;
    await setupPeer();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ offer }));
  } catch (err) {
    alert('Error accessing camera/microphone');
  }
}

function enterSite() {
  document.getElementById('age-check').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  startChat();
}

document.getElementById('chatInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.value.trim()) {
    const msg = e.target.value;
    socket.send(JSON.stringify({ chat: msg }));
    document.getElementById('messages').innerHTML += `<div><b>You:</b> ${msg}</div>`;
    e.target.value = '';
  }
});

document.getElementById('skipBtn').addEventListener('click', () => {
  location.reload();
});