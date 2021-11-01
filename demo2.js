/*
	Verto DEMO
	烟台小樱桃 http://x-y-t.cn
*/

/* verto is a global object, just use it. However,
	if you want to create a secondary verto, try

	var verto2 = new Verto();
	verto2.connect(...)
*/

var cur_call = null;	// the current call object
var confMan = null;		// Conference Manager, not used here
var ringing = false;	// is it ringing?

var protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
var username = localStorage.getItem('xui.username');
var password = localStorage.getItem('xui.password');
var domain = localStorage.getItem('xui.domain');
var socketUrl = localStorage.getItem('xui.socketUrl');
var xuiToken = localStorage.getItem('xui.xuiToken');
var xccToken = localStorage.getItem('xui.xccToken');

// display messages
function display(s) {
	console.log(s);
	document.getElementById('message').append(s);
	document.getElementById('message').appendChild(document.createElement("br"));
}

// check if we should offer video
function check_vid() {
	var use_vid = document.getElementById('use_vid').checked;
	return use_vid;
}

// verto callbacks
var callbacks = {
	// when message received
	onMessage: function(verto, dialog, msg, data) {
		console.log("data", data);
		console.log("msg", msg);
		console.log('verto', verto);
		switch (msg) {
			case window.Verto.enum.message.pvtEvent:
				break;
			case window.Verto.enum.message.clientReady:
				break;
			case window.Verto.enum.message.info:
				break;
			case window.Verto.enum.message.display:
				var party = dialog.params.remote_caller_id_name + "<" + dialog.params.remote_caller_id_number + ">";
				display("Talking to: " + dialog.cidString());
				break;
			default:
				break;
		}
	},

	// when call dialog state changed
	onDialogState: function(d) {
		cur_call = d;

		if (d.state == window.Verto.enum.state.ringing) {
			ringing = true;
		} else {
			ringing = false;
		}

		switch (d.state) {
			case window.Verto.enum.state.ringing:
				display("Call From: " + d.cidString());

				document.getElementById('incall_div').style.display = 'block';

				document.getElementById('ansbtn').addEventListener('click', function() {
					cur_call.answer({
						useStereo: document.getElementById('use_stereo').checked
					});
					document.getElementById('incall_div').style.display = 'none';

				});

				document.getElementById('rejectbtn').addEventListener('click', function() {
					cur_call.hangup({
						"cause": "CALL_REJECTED"
					});
					document.getElementById('incall_div').style.display = 'none';
				});

				if (d.params.wantVideo) {
					document.getElementById('vansbtn').addEventListener('click', function() {
						var ds = getDeviceSettings()
						cur_call.answer({
							useVideo: check_vid(),
							useStereo: document.getElementById('use_stereo').checked,
							useCamera: ds.videoDevice,
							useMic: ds.audioInDevice,
							useSpeak: ds.audioOutDevice,
							outgoingBandwidth: 'default',
							incomingBandwidth: 'default',
							videoBandwidth: {
								max: 2048,
								min: 1024,
								start: 1024
							},
							deviceParams: {
								useMic: ds.audioInDevice,
								useSpeak: ds.audioOutDevice,
								useCamera: ds.videoDevice
							}
						});
						document.getElementById('incall_div').style.display = 'none';
					})
					document.getElementById('vansdiv').style.display = 'block';
				} else {
					document.getElementById('vansdiv').style.display = 'none';
				}

				break;
			case window.Verto.enum.state.trying:
				display("Calling: " + d.cidString());
				break;
			case window.Verto.enum.state.early:
			case window.Verto.enum.state.active:
				display("Talking to: " + d.cidString());
				break;
			case window.Verto.enum.state.hangup:
				display("Call ended with cause: " + d.cause);
			case window.Verto.enum.state.destroy:
				cur_call = null;
				break;
			case window.Verto.enum.state.held:
				break;
			default:
				break;
		}
	},

	// when login success or failed
	onWSLogin: function (v, success) {
		cur_call = null;
		ringing = false;

		if (success) {
			display("login success");
		}
	},

	// when websocket is closed
	onWSClose: function (v, success) {
		if(success){
			display("logout success")
		} else {
			var today = new Date();
			display("Connection Error.<br>Last Attempt: " + today);
		}	
	},
	
	// other events
	onEvent: function (v, e) {
		console.debug("GOT EVENT", e);
	},
};

// make a call
function docall() {
	if (cur_call) {
		console.log("Already in a call");
		return;
	}

	display("Trying");
	const ds = getDeviceSettings();

	cur_call = window.verto.newCall({
		destination_number: document.getElementById('ext').value,
		// the following params are all optional
		useVideo: check_vid(),
		useStereo: document.getElementById('use_stereo').checked,
		useCamera: ds.videoDevice,
		useMic: ds.audioInDevice,
		useSpeak: ds.audioOutDevice,
		outgoingBandwidth: 'default',
		incomingBandwidth: 'default',
		videoBandwidth: {
			max: 720,
			min: 240,
			start: 240
		},
		deviceParams: {
			useMic: ds.audioInDevice,
			useSpeak: ds.audioOutDevice,
			useCamera: ds.videoDevice
		}
	});
}

// initialize
function init() {
	cur_call = null;

	document.getElementById('username').addEventListener('input', function(e) {
		username = e.target.value;
		localStorage.setItem("xui.username", e.target.value);
	});

	document.getElementById('password').addEventListener('input', function(e) {
		password = e.target.value;
		localStorage.setItem("xui.password", e.target.value);
	});

	document.getElementById('domain').addEventListener('input', function(e) {
		domain = e.target.value;
		localStorage.setItem("xui.domain", e.target.value);
	});

	document.getElementById('socketUrl').addEventListener('input', function(e) {
		socketUrl = e.target.value;
		localStorage.setItem("xui.socketUrl", e.target.value);
	});

	document.getElementById('xuiToken').addEventListener('input', function(e) {
		socketUrl = e.target.value;
		localStorage.setItem("xui.xuiToken", e.target.value);
	});

	document.getElementById('xccToken').addEventListener('input', function(e) {
		socketUrl = e.target.value;
		localStorage.setItem("xui.xccToken", e.target.value);
	});

	document.getElementById('logoutbtn').addEventListener('click', function() {
		localStorage.removeItem("xui.password");
		window.verto.logout({cause:"normal close"});
	});

	document.getElementById('loginbtn').addEventListener('click', function() {
		verto.connect({
			login: username + "@" + domain,
			passwd: password, // optional, when use xui_sessid or xcc_token
			socketUrl: socketUrl,
			tag: "webcam",
			ringFile: "./sounds/bell_ring2.wav",
			loginParams: {
				xui_sessid: xuiToken, // optional
				xcc_token: xccToken,  // optional
			},
			audioParams: {
				googAutoGainControl: false,
				googNoiseSuppression: false,
				googHighpassFilter: false
			},
			deviceParams: {
				useCamera: 'any',
				useMic: 'any',
				useSpeak: 'any',
				onResCheck: null
			},
			videoParams: {
				"minWidth": "1280",
				"minHeight": "720",
				"minFrameRate": 15
			},
			iceServers: document.getElementById('use_stun').checked
		}, callbacks);
	});

	document.getElementById('webcam').style.display = 'none';

	document.getElementById('ext').addEventListener('keyup', function(e) {
		if (event.keyCode == 13) {
			docall();
		}
	});
}

document.getElementById('callbtn').addEventListener('click', docall);
document.getElementById('hangupbtn').addEventListener('click', function() {
	cur_call.hangup();
});

// start from here
window.onload = function() {
	if (!domain) domain = window.location.hostname;
	if (!socketUrl) socketUrl = protocol + window.location.host + "/ws"; // /ws is optional
	if (!username) username = '';
	if (!password) password = '';
	if (!xuiToken) xuiToken = '';
	if (!xccToken) xccToken = '';

	document.getElementById('username').value = username;
	document.getElementById('password').value = password;
	document.getElementById('domain').value = domain;
	document.getElementById('socketUrl').value = socketUrl;
	document.getElementById('xuiToken').value = xuiToken;
	document.getElementById('xccToken').value = xccToken;

	init();

	document.getElementById('webcam').addEventListener('click', onVideoClick);
}

function send_dtmf(dtmf)
{
	if (!cur_call) return;
	console.log('send dtmf', dtmf);
	cur_call.dtmf(dtmf);
}

function onVideoClick(e)
{
	console.log('clientX', e.clientX);
	console.log('clientY', e.clientY);
	console.log('pageX', e.pageX);
	console.log('pageY', e.pageY);
	console.log('offsetLeft', e.target.offsetLeft);
	console.log('offsetTop', e.target.offsetTop);
	console.log(e.target.offsetWidth);
	console.log(e.target.offsetHeight);
	console.log(e.target.offsetWidth / e.target.offsetHeight);
	console.log(e.target.videoWidth);
	console.log(e.target.videoHeight);
	console.log(e.target.videoWidth / e.target.videoHeight);

	const tagWidth = e.target.offsetWidth;
	const tagHeight = e.target.offsetHeight;
	const videoWidth = e.target.videoWidth;
	const videoHeight = e.target.videoHeight;

	if (tagWidth === 0 || tagHeight === 0 || videoWidth === 0 || videoHeight === 0) return;

	// var x = e.clientX - e.target.offsetLeft;
	// var y = e.clientY - e.target.offsetTop;

	var rect = e.target.getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;

	console.log(x, y);

	x *= videoWidth / tagWidth;
	y *= videoHeight / tagHeight;

	x = Math.floor(x);
	y = Math.floor(y);

	console.log(x, y);

	const clicked = {w: videoWidth, h: videoHeight, x: x, y: y}
	console.log("clicked", clicked);

	if (cur_call) {
		cur_call.click(clicked);
	}
}

//////////////// device settings ////////////////////////

function getDeviceSettings() {
	var ds = {};

	var autoBand = localStorage.getItem("xui.audio.autoBand") || false;
	var testSpeedJoin = localStorage.getItem("xui.audio.testSpeedJoin") || false;
	var googEchoCancellation = localStorage.getItem("xui.audio.googEchoCancellation") || false;
	var googNoiseSuppression = localStorage.getItem("xui.audio.googNoiseSuppression") || false;
	var googHighpassFilter = localStorage.getItem("xui.audio.googHighpassFilter") || false;
	var googAutoGainControl = localStorage.getItem("xui.audio.googAutoGainControl") || false;
	var useVideo = localStorage.getItem("xui.audio.useVideo") || false;
	var useStereo = localStorage.getItem("xui.audio.useStereo") || false;
	var useSTUN = localStorage.getItem("xui.audio.useSTUN") || false;
	var mirrorInput = localStorage.getItem("xui.audio.mirrorInput") || false;
	var askRecoverCall = localStorage.getItem("xui.audio.askRecoverCall") || false;

	// localStorage is string only so convert them into boolean
	ds.autoBand = autoBand === "true";
	ds.testSpeedJoin = testSpeedJoin === "true";
	ds.googEchoCancellation = googEchoCancellation === "true";
	ds.googAutoGainControl = googAutoGainControl === "true";
	ds.googNoiseSuppression = googNoiseSuppression === "true";
	ds.googHighpassFilter = googHighpassFilter === "true";
	ds.useVideo = useVideo === "true";
	ds.useStereo = useStereo === "true";
	ds.useSTUN = useSTUN === "true";
	ds.mirrorInput = mirrorInput === "true";
	ds.askRecoverCall = askRecoverCall === "true";

	ds.videoDevice = localStorage.getItem("xui.audio.videoDevice") || "any";
	ds.frameRate = localStorage.getItem("xui.audio.frameRate") || 15;
	ds.canvasList = localStorage.getItem("xui.video.canvasList") || "1x1";
	ds.resolution = localStorage.getItem("xui.audio.resolution") || "any";
	ds.audioInDevice = localStorage.getItem("xui.audio.audioInDevice") || "any";
	ds.audioOutDevice = localStorage.getItem("xui.audio.audioOutDevice") || "any";
	ds.shareDevice = localStorage.getItem("xui.audio.shareDevice") || "any";

	return ds;
};

function currentVideoParams() {
	var vid_width = 640;
	var vid_height = 360;

	const ds = getDeviceSettings();

	switch (ds.resolution) {
		case "120p": vid_width = 160; vid_height = 120; break;
		case "QVGA": vid_width = 320; vid_height = 240; break;
		case "VGA":  vid_width = 640; vid_height = 480; break;
		case "SVGA": vid_width = 800; vid_height = 600; break;
		case "180p": vid_width = 320; vid_height = 180; break;
		case "360p": vid_width = 640; vid_height = 360; break;
		case "720p": vid_width =1280; vid_height = 720; break;
		case "1080p":vid_width =1920; vid_height = 1080;break;
		case "QCIF": vid_width = 176; vid_height = 144; break;
		case "CIF":  vid_width = 352; vid_height = 288; break;
		case "4CIF": vid_width = 704; vid_height = 576; break;
		default:     vid_width = 1280;vid_height = 720;
	}

	return {
		videoDevice: ds.videoDevice,
		// new
		width: {min: vid_width, max: vid_width},
		height: {min: vid_height, max: vid_height},
		frameRate: {best: ds.frameRate, min: ds.frameRate, max: ds.frameRate},
		// old
		minHeight: vid_height,
		maxHeight: vid_height,
		minWidth:  vid_width,
		maxWidth:  vid_width,
		minFrameRate: ds.frameRate,
		vertoBestFrameRate: ds.frameRate,
	}
}

function defaultSetting() {
	var defaultSetting = {
		autoBand : true,
		testSpeedJoin : true,
		googEchoCancellation : true,
		googAutoGainControl : true,
		googNoiseSuppression : true,
		googHighpassFilter : true,
		useVideo  : true ,
		useStereo : true ,
		useSTUN : true ,
		mirrorInput : false,
		askRecoverCall : false,
		videoDevice : "any",
		frameRate : 15,
		canvasList : "1x1",
		resolution : "defalut",
		audioInDevice : "defalut",
		audioOutDevice : "defalut",
		shareDevice : "defalut"
	};

	return defaultSetting;
}

devices = {}

function refreshDeviceList() {
	var runtime = function(obj) {
		console.log("refreshDevices runtime", obj);
		devices = {
			cameras: Verto.videoDevices || [],
			microphones: Verto.audioInDevices || [],
			speakers: Verto.audioOutDevices || [],
		};
	}
	Verto.refreshDevices(runtime);
}

function setAudioDevice(idx) {
	a = devices.microphones[idx]

	if (a) {
		localStorage.setItem("xui.audio.audioInDevice", a.id)
		console.log("audio device set to", a.label)
	}
}

function setVideoDevice(idx) {
	c = devices.cameras[idx]

	if (c) {
		localStorage.setItem("xui.audio.videoDevice", c.id)
		console.log("video device set to", c.label)
	}
}

function resetDevices() {
	localStorage.removeItem("xui.audio.audioInDevice")
	localStorage.removeItem("xui.audio.audioOutDevice")
	localStorage.removeItem("xui.audio.videoDevice")
}
