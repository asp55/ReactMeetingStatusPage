import React, { useState, useReducer, useEffect, useRef } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { config } from './config';
import Picker from './Picker.js'
import Room from './Room.js'
import RoomEditor from './RoomEditor.js'

import './RoomMonitor.scss';
import PersistentWebSocket from "./PersistentWebSocket";
    
const ws = new PersistentWebSocket(config.socket_url, [], false);


function RoomMonitor(props) {

  const {debug} = props;


  const nodeRef = useRef(null);
  const roomRef = useRef(null);


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
        if(debug) console.log(`Unsupported Action: ${message.action}`, message);
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
        if(debug) console.log(`Unsupported Action: ${command.action}`);
        return state;
    }

  },{keys:[], startingPosition:{}});

  
  //Use Use effect to connect listereners and start websocket connection on mount
  //And remove them / stop the websocket connection on cleanup
  useEffect(()=>{
    const wsListeners = {
      onopen: (event) => {
        if(debug) console.log("WebSocket is open now.");
        setConnectionStatus("initializing");
        ws.send(JSON.stringify({action:"identify",type:"monitor"}));
      },
      onerror: (error) => {
        if(debug) console.log(`WebSocket error: ${error}`)
      },  
      onclose: (event) => {
          if(debug) console.log("WebSocket is closed now. Reconnecting in 0.5s");
          setConnectionStatus("offline");
      },  
      onmessage: (e) => {
          var message = JSON.parse(e.data);
          if(debug) console.log("Message received: ",{parsed: message, raw: e.data});
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
  }, [debug]);

  const [editRooms, showEditRooms] = useState(false);
  
  useEffect(()=>{
    const escapeListener = (e)=>{
      if(e.code === "Escape") { 
        if(openRooms.keys.length) {
          openRooms.keys.forEach(key=>manageRooms({action:"close", key:key}));
          roomRef.current.focus();
        }
        else if(editRooms) {
          showEditRooms(false);
          roomRef.current.focus();
        }
      }
    }
    window.addEventListener("keydown",escapeListener);

    return ()=>{
      window.removeEventListener("keydown",escapeListener);
    }
  }, [openRooms, editRooms])
/*
  useLayoutEffect(()=>{
    console.log("Layout Effect 107");
    if(openRooms.keys.length) {

    }
    else if(roomRef.current !== null) roomRef.current.focus();

  }, [roomRef, nodeRef, openRooms])
*/

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
          allowFocus={!editRooms && openRooms.keys.length===0}
          onOpenRoom={(key)=>{
            const rect = roomRef.current.getBoundingClientRect();
        
            const startingPosition = {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            }

            manageRooms({
              action:"open", 
              key:key, 
              startingPosition:startingPosition
            })
          }}

          onEdit={()=>{showEditRooms(true)}}
        />
        <TransitionGroup>
          {openRooms.keys.map((key)=>{
            const startingBox = openRooms.startingPosition[key];
            return (
            <CSSTransition key={`transition-${key}`} timeout={300} classNames="room" nodeRef={nodeRef}>
              <Room 
                ref={nodeRef}
                name={rooms.info[key].name}
                status={rooms.info[key].status}
                style={{
                  "--startX": startingBox.x+'px',
                  "--startY": startingBox.y+'px',
                  "--startWidth": startingBox.width+'px',
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
        { editRooms ? <RoomEditor socket={ws} rooms={rooms} onExit={()=>{showEditRooms(false)}}/> : ""}

      </React.Fragment>
      
    )
  }
}

export default RoomMonitor;
