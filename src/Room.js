import Icons from './svgs';
import {forwardRef} from 'react';
import './Room.scss';


function StatusText(props) {
    return (
      <svg viewBox="0 0 850 476" preserveAspectRatio="xMidYMid meet">
      <text x="425" y="238" fill="white" fontFamily="Poppins" fontSize="180" fontWeight="600" textAnchor="middle">
          <tspan dy=".35em" id="statusLabel">{props.children}</tspan>
      </text>
  </svg>
    );
  }

function MeetingAspects(props) {
    const {mic_open, video_on, sharing} = props;
    if(mic_open || video_on || sharing) {
        return (
            <div className="aspects">
                {mic_open ? <Icons.MicOn /> : ""}
                {video_on ? <Icons.VidOn /> : ""}
                {sharing ? <Icons.ScreenOn /> : ""}
            </div>
        )
    }
    else return ("");
}

const Room = forwardRef((props,ref)=>{
    const {status, active, open, name, onBack, onClick, onFocus, onBlur, onDoubleClick, style, tabIndex} = props;

    let displayStatus = "offline";
    let aspects = "";
    let classList = ["room"];

    if(active) classList.push("active");
    if(open) classList.push("open");
    
    if(typeof status === "object") {
        if(!status.inMeeting) {
            displayStatus = "FREE";
            classList.push("free");
        }
        else {
            displayStatus = "MEETING";
            classList.push("busy");
            aspects = <MeetingAspects {...status.inMeeting} />;
        }
    }
    
    return (
        <div 
            tabIndex={tabIndex}
            ref={ref}
            className={classList.join(" ")} 
            onClick={onClick}
            onFocus={onFocus}
            onBlur={onBlur}
            onDoubleClick={(e)=>{
                e.preventDefault();
                if(typeof onDoubleClick==="function")  onDoubleClick(dispatchEvent);
            }}
            onKeyDown={(e)=>{if(e.code==="Enter" && typeof onDoubleClick==="function") onDoubleClick(dispatchEvent); }}
            style={style}
        >
            <div className="controls">
                {open ? <span className="button back" onClick={(e)=>{ e.stopPropagation(); if(typeof onBack==="function") onBack(e);}}><Icons.Tiles/></span> : ""}
                {name}
            </div>
            <div className="status"><StatusText>{displayStatus}</StatusText></div>
            {aspects}
        </div>
    );
});


export default Room;

Room.defaultProps = {
    name: '\u00a0',
    status: "Offline"
}