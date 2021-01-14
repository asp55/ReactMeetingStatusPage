import { useState, useReducer, useEffect } from 'react';
import { config } from './config';
import Icons from './svgs';

import './MonitorPanel.scss';
import PersistentWebSocket from "./PersistentWebSocket";
    
const ws = new PersistentWebSocket(config.socket_url, [], false);

function Status(props) {
  return (
    <svg viewBox="0 0 1168 476" preserveAspectRatio="xMidYMid meet">
    <text x="584" y="238" fill="white" fontFamily="Barlow-SemiBold, Barlow" fontSize="180" fontWeight="600" textAnchor="middle">
        <tspan dy=".35em" id="statusLabel">{props.children}</tspan>
    </text>
</svg>
  );
}

function MeetingAspect(props) {
  let IconOn, IconOff;
  switch(props.which) {
    case "mic":
      IconOn = <Icons.MicOn />;
      IconOff = <Icons.MicOff />;
      break;
    case "video": 
      IconOn = <Icons.VidOn />;
      IconOff = <Icons.VidOff />;
      break;
    case "screen":
    default:
      IconOn = <Icons.ScreenOn />;
      IconOff = <Icons.ScreenOff />;
      break;
  }

  return <div className={["aspect",(props.on?"on":"off")].join(" ").trim()}>{props.on ? IconOn : IconOff}</div>
}

function RoomPanel(props) {
  const {name, status} = props.info;

  let className = "busy";
  let displayStatus;
  let aspects;
  let busy = false;

  if(typeof status === "string") {
    className = "offline";
    displayStatus = status;
  }
  else if(!status.inMeeting) {
    className = "free";
    displayStatus = "FREE";
  }
  else {
    className = "busy";
    busy = true;
    displayStatus = "MEETING";
    aspects = [
      <MeetingAspect which="mic" on={status.inMeeting.mic_open} />,
      <MeetingAspect which="video" on={status.inMeeting.video_on} />,
      <MeetingAspect which="screen" on={status.inMeeting.sharing} />
    ];

  }

  return (<div onClick={props.onClick} className={[props.className,(className==="busy" ? "busy" : "")].join(" ").trim()}>
    <h1>{name}</h1>
    <div className={`status ${className}`}>
      <Status>{displayStatus}</Status>
    </div>
    {aspects}
  </div>);
}

function MonitorPanel() {

  const [activeRoom, pickRoom] = useState("");
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("initializing");
  
  const [rooms, receiveMessage] = useReducer((state, message)=>{
    switch(message.action) {
      case "initialize":
        if(message.rooms.length===1) pickRoom(message.rooms[0]);
        return {keys:message.rooms, info:message.roomInfo};
      case "update":
        state.info[message.room] = message.roomInfo;
        return {...state};
      default:
        console.log(`Unsupported Action: ${message.action}`);
        return state;
    }
  },{keys:[], info:{}});

  
  const _onopen = (event) => {
    console.log("WebSocket is open now.");
    setConnectionStatus("initializing");
    ws.send(JSON.stringify({action:"identify",type:"monitor"}));
  } 
  const _onerror = (error) => {
    console.log(`WebSocket error: ${error}`)
  }

  const _onclose = (event) => {
      console.log("WebSocket is closed now. Reconnecting in 0.5s");
      setConnectionStatus("offline");
      //offlinePanel();
  }

  const _onmessage = (e) => {
      var message = JSON.parse(e.data);
      console.log("Message received: ",{parsed: message, raw: e.data});
      setConnectionStatus("online");
      receiveMessage(message);
  }
  
  useEffect(()=>{
    ws.addEventListener("open", _onopen);
    ws.addEventListener("error", _onerror);
    ws.addEventListener("message", _onmessage);
    ws.addEventListener("close", _onclose);
    ws.start();

    return ()=> {
      ws.removeEventListener("open", _onopen);
      ws.removeEventListener("error", _onerror);
      ws.removeEventListener("message", _onmessage);
      ws.removeEventListener("close", _onclose);
      ws.stop();
    }
  }, []);

  if(connectionStatus==="initializing") return (
    <div className="MonitorPanel">
      <Status>Initializing...</Status>
    </div>
  );
  else if(connectionStatus==="offline") return (
    <div className="MonitorPanel">
      <Status>Offline</Status>
    </div>);
  else {
    //ONLINE
    let picker = "";
    if(showRoomPicker || activeRoom==="") {
      picker = (<div className="Picker">
        {rooms.keys.map(id=><div className="slot"><RoomPanel onClick={()=>{pickRoom(id);setShowRoomPicker(false);}} key={`chip-${id}`} info={rooms.info[id]} className="room"/></div>)}
      </div>)
    }

    let monitor = "";
    if(activeRoom!=="" && activeRoom in rooms.info) {
      monitor = (<RoomPanel info={rooms.info[activeRoom]} className="room" />);
    }
    
    return (
      <div className="MonitorPanel">
        {rooms.keys.length>1?<button onClick={()=>setShowRoomPicker(!showRoomPicker)}>Rooms</button>:""}
        {picker}
        {monitor}
      </div>
    );
  }
}

export default MonitorPanel;
