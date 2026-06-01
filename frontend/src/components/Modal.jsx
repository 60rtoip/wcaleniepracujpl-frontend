import React from 'react'

export default function Modal({children, onClose}){
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',padding:20,minWidth:320}} onClick={e=>e.stopPropagation()}>
        <button style={{float:'right'}} onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  )
}
