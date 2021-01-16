import React, { useState, useReducer, useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
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

  const roomRef = useRef(null);
  const nodeRef = useRef(null);
  const startingPosition = (ref) => {
    const rect = ref.current.getBoundingClientRect(), parentRect = ref.current.parentElement.getBoundingClientRect();

    return {
      bottom: parentRect.bottom - rect.bottom,
      height: rect.height,
      left: rect.left - parentRect.left,
      right: parentRect.right - rect.right,
      top: rect.top - parentRect.top,
      width: rect.width
    }
  }

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
        
        <Picker 
          ref={roomRef}
          rooms={rooms}
          onOpenRoom={(key, e)=>{

            manageRooms({
              action:"open", 
              key:key, 
              startingPosition:startingPosition(roomRef)
            })
          }
        }/>
        <TransitionGroup>
          {openRooms.keys.map((key)=>{
            const startingBox = openRooms.startingPosition[key];
            return (
            <CSSTransition key={`transition-${key}`} timeout={200} classNames="room" nodeRef={nodeRef}>
              <Room 
                ref={nodeRef}
                key={`chip-${key}`}
                name={rooms.info[key].name}
                status={rooms.info[key].status}
                onEdit={()=>console.log(`editRoom(${key})`)}
                style={{
                  "--startTop": startingBox.top+'px',
                  "--startRight": startingBox.right+'px',
                  "--startBottom": startingBox.bottom+'px',
                  "--startLeft": startingBox.left+'px',
                  "--startHeight": startingBox.height+'px'
                }}
                open={true}
                onBack={()=>manageRooms({action:"close", key:key})}
                onDoubleClick={()=>manageRooms({action:"close", key:key})}
              />
            </CSSTransition>
            )}
          )}

        </TransitionGroup>
      </React.Fragment>
      
    )
  }
}

export default MonitorPanel;
