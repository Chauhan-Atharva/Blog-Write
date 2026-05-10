import React from "react";

function Logo({width = "100px"}){
    return (
        <img src="/logo.png" 
        alt="Blog-Write Logo" 
        className="rounded-full object-cover"
        style={{ width }} />
    )
}

export default Logo