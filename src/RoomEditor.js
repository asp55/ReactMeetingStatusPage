import Icons from './svgs';
import {useState, useRef, useLayoutEffect, useEffect} from 'react';

import './RoomEditor.scss';

export default function RoomEditor(props) {
  const {onExit, rooms, socket} = props;
  const ref = useRef(null);

  const [addingRow, setAddingRow] = useState(false);
  const [processingAddingRow, setProcessingAddingRow] = useState(false);
  const [validationError, setValidationError] = useState(false);
  useLayoutEffect(()=>{
    if(addingRow) ref.current.focus();
  }, [addingRow]);


  useEffect(()=>{
    const wsListeners = {
      onmessage: (e) => {
          var message = JSON.parse(e.data);
          console.log("Message received: ",{parsed: message, raw: e.data});
          if(message.action==="add room") {
            setProcessingAddingRow(false);
            if(message.success) dismissAddingRow();
            else setValidationError(message.error);
          }
      }
    }
    
    socket.addEventListener("message", wsListeners.onmessage);

    return ()=> {
      socket.removeEventListener("message", wsListeners.onmessage);
    }
  }, [socket]);

  const processNewRoom = (name) => {
    setProcessingAddingRow(true);
    socket.send(JSON.stringify({action:"add room",name:name}));
  };

  const dismissAddingRow = () => {
    setAddingRow(false);
    setProcessingAddingRow(false);
    setValidationError(false);
  }

  return <div className="overlay" onClick={()=>{if(typeof onExit === "function") onExit();}}>
    <dialog className="modal" onClick={e=>e.stopPropagation()}>
      <header>
        <span className="button close" onClick={(e)=>{ e.stopPropagation(); if(typeof onExit === "function") onExit();}}><Icons.Close/></span>
        <hgroup><h1>Edit Rooms</h1></hgroup>
      </header>
      <main>
        <table>
          <colgroup>
              <col></col>
              <col></col>
              <col></col>
              <col></col>
          </colgroup>
          <thead>
            <tr>
              <td></td>
              <th className="textcell" scope="col">Name</th>
              <th className="textcell" scope="col">Key</th>
              <td></td>
            </tr>
          </thead>
          <tbody>
          {
            rooms.keys.map(id=>{
              return (
                <tr key={`row${id}`}>
                  <td className="textcell" ><input type="checkbox" id={id} name="rooms"/></td>
                  <th className="textcell" scope="row">{rooms.info[id].name}</th>
                  <td className="textcell">{id}</td>
                  <td className="textcell"><span className="button removeRoom" onClick={()=>{
    socket.send(JSON.stringify({action:"remove room", key:id}))}}><Icons.SubtractCircle /></span></td>
                </tr>
              )
            })
          }
          {
            addingRow ? 
            <tr className="nohover">
              <td className="textcell" ></td>
              <td className="inputcell">
                <input 
                  disabled={processingAddingRow}
                  ref={ref} 
                  onBlur={
                    (e)=>{
                      if(e.target.value==="") dismissAddingRow();
                      else {
                        processNewRoom(e.target.value);
                      }
                    }
                  }
                  onKeyPress={
                    (e)=>{
                      if(e.key==="Enter") {
                        if(e.target.value==="") dismissAddingRow();
                        else {
                          processNewRoom(e.target.value);
                        }
                      }
                    }
                  }
                  type="text"
                />
                { processingAddingRow && <span className="spinner">...</span>}
                { validationError && <span className="error">{validationError==="already exists" ? `"${ref.current.value}" already exists`:validationError}</span>}
                </td>
              <td className="textcell"></td>
              <td className="textcell"></td>
            </tr>
            :
            <tr className="nohover addrow"  tabIndex="0" onFocus={()=>{setAddingRow(true)}} onClick={()=>{setAddingRow(true)}}>
              <td className="textcell"></td>
              <td className="textcell" colSpan="2">Add Room</td>
              <td className="textcell"></td>
            </tr>

          }

          </tbody>
        </table>

      </main>

    </dialog>
  </div>
}