import Icons from './svgs';
import './Room.scss';


function StatusText(props) {
    return (
      <svg viewBox="0 0 700 476" preserveAspectRatio="xMidYMid meet">
      <text x="350" y="238" fill="white" fontFamily="Barlow-SemiBold, Barlow" fontSize="180" fontWeight="600" textAnchor="middle">
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

export default function Room(props) {
    const {status, active, open, name, onBack, onEdit, onClick, onDoubleClick, style} = props;

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
            className={classList.join(" ")} 
            onClick={onClick}
            onDoubleClick={(e)=>{
                e.preventDefault(); 
                if(typeof onDoubleClick==="function")  onDoubleClick(e);
            }}
            style={style}
        >
            <div className="controls">
                {open ? <span className="button back" onClick={(e)=>{ e.stopPropagation(); if(typeof onBack==="function") onBack(e);}}><Icons.Tiles/></span> : ""}
                {name}
                <span className="button edit" onClick={(e)=>{ e.stopPropagation(); if(typeof onEdit==="function") onEdit(e);}}><Icons.Cog/></span>
            </div>
            <div className="status"><StatusText>{displayStatus}</StatusText></div>
            {aspects}
        </div>
    );
}

Room.defaultProps = {
    name: '\u00a0',
    status: "Offline"
}