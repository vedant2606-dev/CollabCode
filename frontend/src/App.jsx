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
  const [sidebarOpen, setSidebarOpen] = useState(false);


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
    return (
      <div className='flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4 py-8'>
        <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl text-center w-full max-w-md mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-wide">CollabCode</span>
          </div>
          <h1 className="mb-8 text-gray-800 font-bold text-2xl sm:text-3xl">Join Code Room</h1>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder='Room ID' 
              value={roomId} 
              onChange={e=>setRoomId(e.target.value)} 
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 bg-gray-50 focus:bg-white"
            />
            <button 
              onClick={createRoomId} 
              className="w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none rounded-xl text-base font-semibold cursor-pointer hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Generate Room ID
            </button>
            <input 
              type="text" 
              placeholder='Your Name' 
              value={userName} 
              onChange={e=>setUserName(e.target.value)} 
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-300 bg-gray-50 focus:bg-white"
            />
            <button 
              onClick={joinRoom} 
              className="w-full p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-none rounded-xl text-base font-semibold cursor-pointer hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Join Room
            </button>
          </div>
        </div>
        <p className="text-white/90 text-sm sm:text-base font-medium">Made by Vedant Patil ❤️</p>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-900 text-white overflow-hidden'>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">&lt;/&gt;</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">CollabCode</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full w-80 lg:w-72 xl:w-80 bg-gray-800 border-r border-gray-700 
        transform transition-transform duration-300 ease-in-out z-40
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        flex flex-col
      `}>
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-3 p-6 border-b border-gray-700">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">&lt;/&gt;</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">CollabCode</span>
        </div>

        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">&lt;/&gt;</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">CollabCode</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Room Info */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-4 rounded-xl border border-gray-600 shadow-lg">
            <h2 className="text-sm font-medium text-gray-300 mb-3">Code Room</h2>
            <div className="bg-gray-800 p-3 rounded-lg mb-3 border border-gray-600">
              <p className="text-xs text-gray-400 font-mono break-all leading-relaxed">{roomId}</p>
            </div>
            <button 
              className='w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
              onClick={copyRoomId}
            >
              {copySuccess || 'Copy Room ID'}
            </button>
          </div>

          {/* Users */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Users in Room ({users.length})
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {users.map((user, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                    {user.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200 truncate">{user.slice(0,12)}...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Typing Indicator */}
          <div className="p-3 bg-teal-900/30 border border-teal-700/50 rounded-lg min-h-12 flex items-center">
            <p className='text-sm text-teal-400 italic'>
              {typing || <span className="text-gray-500">No one is typing...</span>}
            </p>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Programming Language</label>
            <select 
              className='w-full p-3 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all' 
              value={language} 
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        {/* Leave Button */}
        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={leaveRoom} 
            className='w-full py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white border-none rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        {/* Code Editor - Maximum Space */}
        <div className="flex-1 min-h-0 border-b border-gray-700" style={{minHeight: 'calc(100vh - 280px)'}}>
          <Editor
            height="100%"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme='vs-dark'
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 }
            }}
          />
        </div>

        {/* Compact Bottom Panel */}
        <div className="bg-gray-800 border-t border-gray-700">
          {/* Input Console - Compact */}
          <div className="border-b border-gray-700">
            <textarea 
              className='w-full h-12 sm:h-14 p-3 font-mono bg-gray-800 text-gray-200 border-none resize-none text-sm leading-relaxed focus:outline-none focus:bg-gray-750 placeholder-gray-500 transition-colors' 
              style={{fontFamily: 'Consolas, Monaco, "Courier New", monospace'}} 
              value={userInput} 
              onChange={e=>setUserInput(e.target.value)} 
              placeholder='Program input...'
            />
          </div>

          {/* Action Buttons - Compact */}
          <div className='flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2 p-3 border-b border-gray-700'>
            <button 
              className='flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-28 text-sm' 
              onClick={runCode}
            >
              ▶ Execute
            </button>
            <button 
              onClick={handleSave} 
              className='flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 min-w-28 text-sm'
            >
              💾 Save
            </button>
          </div>

          {/* Output Console - Expanded */}
          <div className="h-40 sm:h-44 lg:h-48">
            <textarea 
              className='w-full h-full p-3 font-mono text-sm leading-relaxed bg-gray-900 text-gray-200 border-none resize-none overflow-y-auto whitespace-pre-wrap focus:outline-none placeholder-gray-500' 
              style={{fontFamily: 'Consolas, Monaco, "Courier New", monospace'}} 
              value={output} 
              readOnly 
              placeholder='Output...'
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
