import React, { useState, useReducer, useEffect } from 'react';
import { config } from './config';
import Picker from './Picker.js'
import Room from './Room.js'

import './MonitorPanel.scss';
import PersistentWebSocket from "./PersistentWebSocket";
    
const ws = new PersistentWebSocket(config.socket_url, [], false);


function MonitorPanel() {

  const [connectionStatus, setConnectionStatus] = useState("initializing");

  const [rooms, receiveMessage] = useReducer((state, message)=>{
    switch(message.action) {
      case "initialize":
        return {keys:message.rooms, info:message.roomInfo};
      case "update":
        state.info[message.room] = message.roomInfo;
        return {...state};
      default:
        console.log(`Unsupported Action: ${message.action}`);
        return state;
    }
  },{keys:[], info:{}});


  
  const [openRooms, manageRooms] = useReducer((state, command)=>{
    switch(command.action) {
      case "open":
        if(!state.keys.includes(command.key)) {
          if(rooms.keys.includes(command.key)) {
            state.keys.push(command.key);
            state.startingPosition[command.key] = command.startingPosition;
          }
        }
        return {...state};
      case "close":
        if(state.keys.includes(command.key)) {
          state.keys.splice(state.keys.indexOf(command.key),1);
          delete state.startingPosition[command.key];
        }
        return {...state};
      default:
        console.log(`Unsupported Action: ${command.action}`);
        return state;
    }

  },{keys:[], startingPosition:{}});

  
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
      Initializing...
    </div>
  );
  else if(connectionStatus==="offline") return (
    <div className="MonitorPanel">
      Server Offline
    </div>);
  else {    
    return (
      <React.Fragment>
        <Picker rooms={rooms} onOpenRoom={(key, e)=>{manageRooms({action:"open", key:key, startingPosition:e.target.getBoundingClientRect()})}}/>
        {openRooms.keys.map((key)=>
          <Room 
            key={`chip-${key}`}
            name={rooms.info[key].name}
            status={rooms.info[key].status}
            onEdit={()=>console.log(`editRoom(${key})`)}
            style={{"--testVar": 13}}
            open={true}
            onBack={()=>manageRooms({action:"close", key:key})}
          />
        )}
      </React.Fragment>
      
    )
  }
}

export default MonitorPanel;
