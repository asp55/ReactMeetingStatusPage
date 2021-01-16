import React from 'react';
import Room from './Room.js'

import './Picker.scss';
function rem2px(rem) {    
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}
function px2rem(px) {
  return px/parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function updatePickerHeight() {
    let picker = document.querySelector(".picker");
    if(picker) {
        let pickerStyle = picker.style;
    
        //Remove grid-template-columns override to get "natural" tile width
        pickerStyle.removeProperty("grid-template-columns");
        let room = picker.firstChild;
        if(room) {
            let tileWidth = room.offsetWidth;
            
            /*
            Ensure that tiles stay fully visible in windows that are wide and short
            */
            //Available height = windowInnerHeight - padding
            const availableHeight = window.innerHeight-rem2px(2);
            
            if(tileWidth > availableHeight) {
                tileWidth = availableHeight;
                pickerStyle.setProperty(
                    "grid-template-columns",
                    `repeat(auto-fit, minmax(13rem, ${px2rem(availableHeight)}rem))`
                );
            }
            
            pickerStyle.setProperty("grid-auto-rows", `max(13rem, ${px2rem(tileWidth)}rem)`);
        }
        
    }
    
}

class Picker extends React.Component {
    constructor(props) {
        super(props);
        this.hasBeenRendered = false;
        this.state = {
            selectedRoom: ""
        }
    }

    componentDidMount() {
        window.addEventListener("resize", updatePickerHeight, {passive:true});
        updatePickerHeight();
    }
    componentWillUnmount() {
        window.removeEventListener("resize", updatePickerHeight, {passive:true})
    }

    componentDidUpdate(prevProps) {
        if(!this.hasBeenRendered || this.props.rooms.keys.length !== prevProps.rooms.keys.length ) {
            this.hasBeenRendered = true;
            updatePickerHeight();
        }
    }

    openRoom(key, event) {
        if(typeof this.props.onOpenRoom === "function") {
            this.props.onOpenRoom(key, event);
        }
    }

    editRoom(key) {
        console.log(`editRoom(${key})`);
    }

    render() {
        const {rooms, forwardedRef} = this.props;

        return (
            <div className="picker" onClick={()=>{this.setState({selectedRoom: ""})}}>
            {rooms.keys.map(id=>{
                const roomOnline = (typeof rooms.info[id].status === "object");
                return (
                    <Room 
                        ref={this.state.selectedRoom === id ? forwardedRef : null}
                        key={`chip-${id}`}
                        name={rooms.info[id].name}
                        status={rooms.info[id].status}
                        active={this.state.selectedRoom === id}
                        onClick={(e)=>{
                            e.stopPropagation();
                            this.setState({selectedRoom: id})
                        }}
                        onDoubleClick={(e)=>{if(roomOnline) this.openRoom(id, e)}}
                        onEdit={()=>this.editRoom(id)}
                    />
            )})}
            </div>
        )
    }
}

export default React.forwardRef(function picker(props, ref) {return <Picker forwardedRef={ref} {...props} /> });