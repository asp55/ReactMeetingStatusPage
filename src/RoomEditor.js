import Icons from './svgs';
import {useState, useRef, useLayoutEffect, useEffect, useCallback} from 'react';

import './RoomEditor.scss';

export default function RoomEditor(props) {
  const {onExit, rooms, socket} = props;
  const ref = useRef(null);

  const [addingRow, setAddingRow] = useState(false);
  const [processingAddingRow, setProcessingAddingRow] = useState(false);
  const [validationError, setValidationError] = useState(false);

  //Focus into adding row after adding row is constructed
  useLayoutEffect(()=>{
    ref.current.focus();
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
    name = name.trim();
    if(name==="") dismissAddingRow();
    else {
      setProcessingAddingRow(true);
      socket.send(JSON.stringify({action:"add room",name:name}));
    }
  };

  const dismissAddingRow = () => {
    setAddingRow(false);
    setProcessingAddingRow(false);
    setValidationError(false);
  }

  const doExit = useCallback(()=>{if(typeof onExit === "function") onExit();}, [onExit]);

  /*
  useEffect(()=>{
    const listenForEscale = (e)=>{
      if(e.code==="Escape") doExit();
    };
    window.addEventListener("keydown", listenForEscale);
    return ()=>{
      window.removeEventListener("keydown", listenForEscale);
    }
  },[doExit])
*/

  return <div className="overlay" onClick={doExit}>
    <dialog className="modal" onClick={e=>e.stopPropagation()}>
      <header>
        <button className="button close" tabIndex="0" onClick={(e)=>{ e.stopPropagation(); doExit();}}><Icons.Close/></button>
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
                  <th className="textcell" scope="row">{rooms.info[id].name}</th>
                  <td className="textcell">{id}</td>
                  <td className="textcell"><button className="button removeRoom" onClick={()=>{
    socket.send(JSON.stringify({action:"remove room", key:id}))}} tabIndex="0"><Icons.SubtractCircle /></button></td>
                </tr>
              )
            })
          }
          {
            addingRow ? 
            <tr className="nohover">
              <td className="inputcell">
                <input 
                  disabled={processingAddingRow}
                  ref={ref} 
                  onBlur={
                    (e)=>{
                      if(e.target.value.trim==="") dismissAddingRow();
                      else {
                        processNewRoom(e.target.value);
                      }
                    }
                  }
                  onKeyDown={
                    (e)=>{
                      e.stopPropagation();
                      if(e.code==="Enter") {
                        if(e.target.value==="") dismissAddingRow();
                        else {
                          processNewRoom(e.target.value);
                        }
                      }
                      else if(e.code==="Escape") dismissAddingRow();
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
            <tr className="nohover addrow"  tabIndex="0" ref={ref} onKeyPress={(e=>{if(["Space", "Enter"].includes(e.code)) setAddingRow(true); })} onClick={()=>{setAddingRow(true)}}>
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