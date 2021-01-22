import React, { useState, useReducer, useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { config } from './config';
import Picker from './Picker.js'
import Room from './Room.js'

import './RoomMonitor.scss';
import PersistentWebSocket from "./PersistentWebSocket";
    
const ws = new PersistentWebSocket(config.socket_url, [], false);


function RoomMonitor() {

  const [connectionStatus, setConnectionStatus] = useState("initializing");

  //reducer to handle receiving messages from the websocket & updating the rooms accordingly
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

  //Reducer to handle opening/closing rooms
  //Should really only ever have one open room at a time, but by using a reducer we prevent weird behaviors from coinciding transitions
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

  
  //Use Use effect to connect listereners and start websocket connection on mount
  //And remove them / stop the websocket connection on cleanup
  useEffect(()=>{
    const wsListeners = {
      onopen: (event) => {
        console.log("WebSocket is open now.");
        setConnectionStatus("initializing");
        ws.send(JSON.stringify({action:"identify",type:"monitor"}));
      },
      onerror: (error) => {
        console.log(`WebSocket error: ${error}`)
      },  
      onclose: (event) => {
          console.log("WebSocket is closed now. Reconnecting in 0.5s");
          setConnectionStatus("offline");
      },  
      onmessage: (e) => {
          var message = JSON.parse(e.data);
          console.log("Message received: ",{parsed: message, raw: e.data});
          setConnectionStatus("online");
          receiveMessage(message);
      }
    }
    
    ws.addEventListener("open", wsListeners.onopen);
    ws.addEventListener("error", wsListeners.onerror);
    ws.addEventListener("message", wsListeners.onmessage);
    ws.addEventListener("close", wsListeners.onclose);
    ws.start();

    return ()=> {
      ws.removeEventListener("open", wsListeners.onopen);
      ws.removeEventListener("error", wsListeners.onerror);
      ws.removeEventListener("message", wsListeners.onmessage);
      ws.removeEventListener("close", wsListeners.onclose);
      ws.stop();
    }
  }, []);

  const roomRef = useRef(null);
  const nodeRef = useRef(null);



  if(connectionStatus==="initializing") return (
    <div className="RoomMonitor">
      Initializing...
    </div>
  );
  else if(connectionStatus==="offline") return (
    <div className="RoomMonitor">
      Server Offline
    </div>);
  else {
    return (
      <React.Fragment>
        <Picker 
          ref={roomRef}
          rooms={rooms}
          onOpenRoom={(key)=>{
            const rect = roomRef.current.getBoundingClientRect(), parentRect = roomRef.current.parentElement.getBoundingClientRect();
        
            const startingPosition = {
              bottom: parentRect.bottom - rect.bottom,
              height: rect.height,
              left: rect.left - parentRect.left,
              right: parentRect.right - rect.right,
              top: rect.top - parentRect.top,
              width: rect.width
            }

            manageRooms({
              action:"open", 
              key:key, 
              startingPosition:startingPosition
            })
          }}
        />
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

export default RoomMonitor;