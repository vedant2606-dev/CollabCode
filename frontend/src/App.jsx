import { useState } from 'react';
import './App.css';
import Editor from '@monaco-editor/react'
import { useEffect } from 'react';
import {v4 as uuid} from "uuid";
import socket from './services/socket';
import Swal from "sweetalert2";


const App = () => {
  const starterCode = {
  javascript: `console.log("Hello, World!");`,
  python: `print("Hello, World!")`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`
};

  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("")
  const [language , setLanguage] = useState("javascript")
  const [code, setCode] = useState(starterCode[language])
  const [copySuccess, setCopySuccess] = useState("")
  const [users, setUsers] = useState([])
  const [typing, setTyping] = useState("")
  const [output, setOutput] = useState("")
  const [version, setVersion] = useState("*")
  const [userInput, setUserInput] = useState("")


  useEffect(()=>{
    socket.on("userJoined", (users)=>{
      setUsers(users)
    });

    socket.on("codeUpdate", (newCode)=>{
      setCode(newCode);
    })

    socket.on("userTyping", (user)=>{
      setTyping(`${user.slice(0,8)}... is Typing`);
      setTimeout(()=>setTyping(""), 2000)
    })

    socket.on("languageUpdate", (newLanguage)=>{
        setLanguage(newLanguage);
    })

    socket.on("codeResponse", (response)=>{
      setOutput(response.run.output)
    })

    return ()=>{
      socket.off("userJoined")
      socket.off("codeUpdate")
      socket.off("userTyping")
      socket.off("languageUpdate")
      socket.off("codeResponse")

    }
  }, []);

  useEffect(()=>{
    const handleBeforeUnload = ()=>{
      socket.emit("leaveRoom");
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return ()=>{
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const joinRoom = ()=>{
    if(roomId && userName){
      socket.emit("join", {roomId, userName, starterCode: starterCode[language]});
      setJoined(true)
    }
  }

  const leaveRoom = ()=>{
    socket.emit("leaveRoom");
    setJoined(false)
    setRoomId("")
    setUserName("")
    setCode(starterCode[language])
    setLanguage("javascript")
  }

  const copyRoomId = ()=>{
    navigator.clipboard.writeText(roomId)
    setCopySuccess("Copied");
    setTimeout(()=>setCopySuccess(""), 2000)
  }

  const handleCodeChange = (newCode)=>{
      setCode(newCode);
      socket.emit("codeChange", {roomId, code:newCode});
      socket.emit("typing", {roomId, userName})
      
  }

  const handleLanguageChange = (e)=>{
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCode(starterCode[newLanguage])
    socket.emit("languageChange", {roomId, language : newLanguage})
  }

  const handleSave = async()=>{
    const extensions = {
      javascript: "js",
      python: "py",
      cpp: "cpp",
      html: "html",
      css: "css"
    };
    const { value: fileName } = await Swal.fire({
    title: "Enter file name",
    input: "text",
    inputPlaceholder: "myFile",
    showCancelButton: true
  });

  if (!fileName) return;

  const fileExtension = extensions[language] || "txt";
  const blob = new Blob([code], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.${fileExtension}`;
  link.click();
  };
  

  const runCode = ()=>{
    socket.emit("compileCode", {code, roomId, language, version, input:userInput})
  }

  const createRoomId = ()=>{
    const roomId = uuid();
    setRoomId(roomId)
  }

  if(!joined){
    return <div className='join-container'>
      <div className="join-form">
        <div className="brand-header">
  <img src="/logo.png" alt="CollabCode Logo" className="brand-logo" />
  <span className="brand-name">CollabCode</span>
</div>
        <h1>Join Code Room</h1>
        <input type="text" placeholder='Room id' value={roomId} onChange={e=>setRoomId(e.target.value)} />
        <button onClick={createRoomId}>Create Id</button>
        <input type="text" placeholder='Your Name' value={userName} onChange={e=>setUserName(e.target.value)} />
        <button onClick={joinRoom}>Join Room</button>
      </div>
      <h3>Made by Vedant Patil ❤️</h3>
      
      
    </div>
    
  }
  return (
    <div className='editor-container'>
      <div className="sidebar">
         <div className="brand-header">
  <img src="./public/logo.png" alt="CollabCode Logo" className="brand-logo" />
  <span className="brand-name">CollabCode</span>
</div>
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button className='copy-button' onClick={copyRoomId}>Copy Id</button>
          {
            copySuccess && <span className='copy-success'>{copySuccess}</span>
          }
        </div>
        <h3>Users in Room: </h3>
        <ul>
          {
            users.map((user, index)=>(
              <li key={index}>{user.slice(0,8)}...</li>
            ))
          }
        </ul>
        <p className='typing-indicator'>
          {typing}
        </p>
        <select className='language-selector' value={language} onChange={handleLanguageChange}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select> 
        <button onClick={leaveRoom} className='leave-button'>Leave Room</button>
      </div>
      <div className="editor-wrapper">
        <Editor
        height={"100%"}
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={handleCodeChange}
        theme='vs-dark'
        options={
          {
            minimap:{enabled:false},
            fontSize:14
          }
        }
        />
        <textarea className='input-console' value={userInput} onChange={e=>setUserInput(e.target.value)} placeholder='Enter input here...'></textarea>
        <div className='click-btns'>
        <button className='run-btn' onClick={runCode}>Execute</button>
        <button onClick={handleSave} className='save-btn'>Save Code</button>
        </div>
        <textarea className='output-console' value={output} readOnly placeholder='Output will appear here....'></textarea>
      </div>
    </div>
  )
}

export default App
