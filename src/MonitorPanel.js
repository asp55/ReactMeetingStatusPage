import { useState, useReducer, useEffect } from 'react';
import { config } from './config';

import './MonitorPanel.scss';
import PersistentWebSocket from "./PersistentWebSocket";
    
const ws = new PersistentWebSocket(config.socket_url, [], false);

function StatusPane(props) {
  return (
    <div className={props.className}><svg viewBox="0 0 1168 476" preserveAspectRatio="xMidYMid meet">
    <text x="584" y="238" fill="white" fontFamily="Barlow-SemiBold, Barlow" fontSize="180" fontWeight="600" textAnchor="middle">
        <tspan dy=".35em" id="statusLabel">{props.children}</tspan>
    </text>
</svg></div>
  );
}

function RoomPanel(props) {
  const {name, status} = props.info;

  let displayStatus;
  let busy = false;

  if(typeof status === "string") {
    displayStatus = <StatusPane className="status offline">{status}</StatusPane>
  }
  else if(!status.inMeeting) {
    displayStatus = <StatusPane className="status free">FREE</StatusPane>
  }
  else {
    busy = true;
    displayStatus = <StatusPane className="status busy">MEETING</StatusPane>
  }

  return (<div onClick={props.onClick} className={[props.className,(busy ? " busy" : "")].join(" ").trim()}>
    <h1>{name}</h1>
    {displayStatus}
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
      <StatusPane>Initializing...</StatusPane>
    </div>
  );
  else if(connectionStatus==="offline") return (
    <div className="MonitorPanel">
      <StatusPane>Offline</StatusPane>
    </div>);
  else {
    //ONLINE
    let picker = "";
    if(showRoomPicker || activeRoom==="") {
      picker = (<div className="Picker">
        {rooms.keys.map(id=><RoomPanel onClick={()=>{pickRoom(id);setShowRoomPicker(false);}} key={`chip-${id}`} info={rooms.info[id]} className="room"/>)}
      </div>)
    }

    let monitor = "";
    if(activeRoom!=="" && activeRoom in rooms.info) {
      monitor = (<RoomPanel info={rooms.info[activeRoom]} className="Monitor" />);
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
