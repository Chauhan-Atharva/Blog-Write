import React from "react";

function Logo({width = "100px"}){
    return (
        <div>
            <img
      src="/logo.png"
      alt="Logo"
      className="rounded-full object-cover"
      style={{ width, height: width }}
    />
        </div>
    )
}

export default Logo