import "./App.css";
import React from "react";
import Client from "./Client.js";
import { useState, useRef, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useHref,
} from "react-router-dom";
/**
 * App is the main entrypoint of the react app. It contains a Solace Client
 * that can be connected and disconnected, and used to send and receive messages
 */
// ... (your imports)

const App = () => {
  const [connected, setConnected] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [messages, setMessages] = useState([]);
  const [responses, setResponse] = useState({});
  const [promptdisplay, setPromptdisplay] = useState("");
  const [peopleConnected, setPeopleConnected] = useState([]);
  const [answer, setAnswer] = useState();
  const [username, setUsername] = useState();
  const [gameID, setGameID] = useState("");
  const [myGameid, setMyGameid] = useState("");
  const [host, setHost] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [juding, setJuding] = useState(false)
  const [numResponses, setNumResponse] = useState(0)
  const [displayResposes, SetDisplayResponses] = useState([])
  const [numRound, setNumRound] = useState(10)

  const [leaderboard, setLeaderBoard] = useState({})
   

  const componentMounted = useRef(false);

  const client = useRef(
    new Client(
      (event) => setConnected(true),
      (event) =>
        alert("Something went wrong: API disconnected: " + event.reason)
    )
  );
  useEffect(() => {
    const min = 1000;
    const max = 9999;
    const num = Math.floor(Math.random() * (max - min + 1)) + min;

    if (!componentMounted.current) {
      setMyGameid(num.toString());
      console.log(num);
      componentMounted.current = true;

      const setup = async () => {
        await client.current.connect();
        await client.current.subscribe(
          "game/" + num.toString(),
          (topic, message) => onMessage(topic, message)
        );
      };

      setup();
    }
  }, []); // Empty dependency array to run the effect only once

  const substoGame = () => {
    console.log("game id using: "+gameID)
    // client.current.subscribe("game/" + gameID.toString(), (topic, message) =>
     
    // );
    client.current.subscribe(
      "game/" + gameID.toString() + "/prompt",
      (topic, message) => onMessage(topic, message)
    );

    client.current.subscribe(
      "game/" + gameID.toString() + "/playing",
      (topic, message) => onMessage(topic, message)
    );
    client.current.subscribe(
      "game/" + gameID.toString() + "/timer",
      (topic, message) => onMessage(topic, message)
    );

    client.current.subscribe(
      "game/" + gameID.toString() + "/juding",
      (topic, message) => onMessage(topic, message)
    );
    client.current.subscribe(
      "game/" + gameID.toString() + "/response",
      (topic, message) => onMessage(topic, message)
    );
    client.current.subscribe(
      "game/" + gameID.toString() + "/response/display",
      (topic, message) => onMessage(topic, message)
    );
  };
  const publish = () => {
    console.log("game/" + gameID);
    client.current.publish("game/" + gameID, messageBody);
  };

  const onMessage = (topic, message) => {
    console.info("Received message: " + message.dump());
    console.log(message.getBinaryAttachment());
    console.log(message.getDestination().name);
    
    setMessages((prevMessages) => [message, ...prevMessages]);
  };



  const thisHost = () => {
    // Update multiple states when the button is clicked

    setGameID(myGameid);
    console.log("gameid" + gameID.toString() + " my gameid: " + myGameid);

    //game starts playing
    setHost(true); // marking this as host
    // Update more states as needed
  };

  const startGame = () => {
    setPlaying(true);
    client.current.subscribe(
      "game/" + gameID.toString() + "/response",
      (topic, message) => onMessage(topic, message)
    );
    client.current.publish("game/" + gameID + "/playing", "playing");
    client.current.unsubscribe("game/" + gameID + "/connected");
    getPrompt();
    handleStart();

  };

  useEffect(() => {
    if (host) {
      console.log("gameid" + gameID.toString() + " my gameid: " + myGameid);

      client.current.subscribe(
        "game/" + gameID.toString() + "/response",
        (topic, message) => onMessage(topic, message)
      ); // subscribe to response topic to filter responses messages

      client.current.subscribe(
        "game/" + gameID + "/connected",
        (topic, message) => onMessage(topic, message)
      ); //subscribe to response topic to filter connected messages
    }
  }, [gameID]);

  const thisClient = () => {
    substoGame();
    // Update multiple states when the button is clicked
    setPlaying(true);
    setHost(false);
      client.current.publish("game/" + gameID + "/connected", username);
    

    console.log("pub");
    
    // Update more states as needed
  };
  const getRandomUniqueElement = (() => {
    const prompts = [
      "The worst time to start a conga line.",
      "Unlikely advice from a fortune cookie.",
      "A terrible superpower: the ability to turn into ___.",
      "The worst advice for a first date.",
      "Terrible name for a band.",
      "Worst prize you can win.",
      "An unusual unusual talent to put in your resume.",
      "If life were a video game, what would be the final boss.",
      "Strange location for a first date.",
      "The most unlikely celebrity endorsement.",
      "An inappropriate time to burst into laughter.",
    ];

    let lastRandomIndex = -1;

    return () => {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * prompts.length);
      } while (randomIndex === lastRandomIndex);

      lastRandomIndex = randomIndex;
      return prompts[randomIndex];
    };
  })();

  const submit = () => {
    console.log("publishing game/" + gameID);
    client.current.publish("game/" + gameID + "/response", answer+"-"+username); // publish responses
  };

  const getPrompt = () => {

    const tempP = getRandomUniqueElement()
    console.log("publish promt")
    setPromptdisplay(tempP)
    client.current.publish("game/" + gameID+"/prompt", tempP);
  };
  const [seconds, setSeconds] = useState(30);
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    
    if (messages.length >0) {
      console.log(messages)
      console.log("checking message topic" + messages[0].getDestination().name);
      var topicname = messages[0].getDestination().name;
      // console.log(topicname + " "+gameID)
      if (topicname == "game/" + gameID + "/response") {
        
        const user = messages[0].getBinaryAttachment().split("-")[1];
        const response_v = messages[0].getBinaryAttachment().split("-")[0];  
        console.log({[response_v]:user})
        setResponse({[response_v]:user})
        // setResponse((prevMessages) => [
        //   // store users responses
        //   messages[0].getBinaryAttachment(),
        //   ...prevMessages,
        // ]);
      } else if (topicname == "game/" + gameID.toString() + "/connected") {
        setPeopleConnected((prevMessages) => [
          // keep track of number of people joined and their username
          messages[0].getBinaryAttachment(),
          ...prevMessages,
        ]);

        console.log(peopleConnected);
        // game/{gameid}/playing
      } else if (topicname == "game/" + gameID.toString() + "/playing") {
        setStarted(true);
        setJuding(false)
        console.log("game should be playing")
      }
      else if(topicname == "game/" + gameID.toString() + "/timer"){
        console.log("timer getting")
        if(!isActive){
          handleStart()
        }
        // setSeconds(parseInt(messages[0].getBinaryAttachment()))
      } else if(topicname == "game/" + gameID.toString() + "/juding"){
        setJuding(true)
        console.log("juding time")
      }  else if (topicname == "game/" + gameID + "/response/display") {
      console.log("setting messages to set display")
        SetDisplayResponses((prevMessages) => [
          // store users responses
          messages[0].getBinaryAttachment(),
          ...prevMessages,
        ]);
      }else if(topicname == "game/" + gameID+"/prompt"){
        console.log(messages[0].getBinaryAttachment() +"setting this one the client side")
        setPromptdisplay(messages[0].getBinaryAttachment())
      }
      
    }
  }, [messages]);



  useEffect(() => {
    let interval;
    if(host && isActive){
      // client.current.publish("game/" + gameID + "/timer", seconds.toString());

    }
      if (isActive && seconds > 0) {
        interval = setInterval(() => {
          setSeconds((prevSeconds) => prevSeconds - 1);

        }, 1000);

      } else{
        handleReset()
        clearInterval(interval);
      }
    
    return () => {
      clearInterval(interval);
    };
  }, [isActive, seconds]);

  const handleStart = () => {
    setSeconds(10);
    if(host){
    client.current.publish("game/" + gameID + "/timer","timer")
    }
    console.log("time starting")
    setIsActive(true);
  };

  const handleReset = () => {
    setSeconds(10);
    SetDisplayResponses([])
    setIsActive(false);
  };
  const displayTime = () => {
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  const getResponses = () =>{
    Object.keys(responses).forEach((item) => {
      client.current.publish("game/" + gameID+ "/response/display",item);
      SetDisplayResponses((prevMessages) => [
          item,
          ...prevMessages,
        ]);
      
    });
  
  }
useEffect(() => {
  if(host){
    if(seconds<=1 && !juding ){ //set to juding
    handleStart()
    setTimeout (1000)
    client.current.publish("game/" + gameID+ "/juding","juding");
    console.log("juding now")
    setJuding(true)
    getResponses()
    // client.current.publish("game/" + gameID+ "/numResponse",0)
   
    
  }else if(seconds<=1 && juding ){ //set to not juding
    setJuding(false)
    handleStart()
    getPrompt()
    SetDisplayResponses("")
    setResponse({})
    client.current.publish("game/" + gameID+ "/playing","playing");
  }
  }else{
  if(seconds<=1 && !juding){ //set to juding
    console.log("juding now")
    setPromptdisplay("no prompt")
    handleStart()
    
  }else if(seconds<=1 && juding ){ //set to not juding
    SetDisplayResponses("")
    handleStart()
  }
}},[seconds])

const vote = (msg,e) =>{
  client.current.publish("game/" + gameID+ "/juding"+"/vote",msg);
  e.target.disabled = true;
}
  return (
    <div className="App">
      {!playing && !host && (
        <header className="App-header">
          <div className="pubsub-container">
            <div className="pubsub-component text-white font-bold flex justify-center items-center flex-col ">
              <h3>Welcome to</h3>
              <div className=" animate-bounce flex flex-row">
                <h1 className="text-4xl text-orange-500">W</h1>
                <h1 className="text-4xl text-red-500">I</h1>
                <h1 className="text-4xl text-lime-500">S</h1>
                <h1 className="text-4xl text-green-500">E</h1>
                <h1 className="text-4xl text-purple-500">C</h1>
                <h1 className="text-4xl text-orange-500">R</h1>
                <h1 className="text-4xl text-green-500">A</h1>
                <h1 className="text-4xl text-purple-500">C</h1>
                <h1 className="text-4xl text-lime-500">K</h1>
                <h1 className="text-4xl text-red-500">Z</h1>
              </div>
              <div className="p-10">
                <div className="text-lg ">Enter a Username:</div>
                <input
                  className="rounded text-black"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="text-lg">Enter a Game ID to join: </div>
              <div className="p-10">
                {" "}
                <input
                  className="rounded text-black"
                  type="text"
                  value={gameID}
                  onChange={(e) => setGameID(e.target.value)}
                />
              </div>
              <div>
                <button
                  className=" mt-10 pl-10 pr-10 p-5 bg-lime-400 text-white text-xl  rounded"
                  onClick={(e) => thisClient()}
                >
                  Join
                </button>
              </div>

              <a className="text-4xl p-10 font-bold">OR</a>
              <div className="pubsub-component">
                <button
                  className="p-5 text-xl rounded bg-purple-700"
                  onClick={(e) => thisHost()}
                >
                  Create a Game
                </button>
              </div>

              <div className="pubsub-component"></div>

              {messages && messages.map && messages.map.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    className="message bg-orange-500 text-white text-lg p-10"
                    key={"msg-" + index}
                  >
                    {msg}
                  </div>
                ))
              ) : (
                <div>No messages</div>
              )}
            </div>
          </div>
        </header>
      )}
      {playing && !host && (
        <div>
          <div className="m-10">
            <p className=" items-center justify-center flex text-white font-bold rounded-full w-16 h-16 bg-green-500 ">
              {displayTime()}
            </p>
          </div>
          <div className="Game w-full min-h-screen flex flex-col items-center ">
            {started && !juding&& (
              
              <div className="flex flex-col">
                 {/* {promptdisplay != "" && (
              <div className="p-2 ">
                <a className="bg-orange-500 text-white text-lg p-5 rounded">
                  {promptdisplay}
                </a>
              </div>
            )} */}
                <input className="m-10"
                  type="text"
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <button className="p-2 bg-white text-black font-bold text-xl rounded"onClick={(e) => submit()}> Sumbit response</button>
              </div>
            )}
            {!started && !juding&&(
              <div className="inline-block">
                <div className="inline-block h-8 w-8 animate-spin border-red-500 rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>

   
            
              <a className=" text-xl text-white font-bold">  Waiting for host to start the game</a>

              </div>
            )}
            {juding&&(
              <div>
                {displayResposes &&
                  displayResposes.map &&
                  displayResposes.map.length > 0 ? (
                    displayResposes.map((msg, index) => (
                      <div
                        className="text-white bg-green-500 p-5 m-10 rounded"
                        key={"msg-" + index}
                      >
                        <button onClick={(e) => {vote(msg,e)}} className="p-1">
                        {msg}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div>No messages</div>
                  )}
                  </div>
            )}
          </div>
        </div>
       ) }
      {!playing && host && (
        <div className="flex  p-10 justify-center items-center   content-around flex-col">
          <div className=" animate-bounce flex flex-row">
            <h1 className="text-4xl text-orange-500">W</h1>
            <h1 className="text-4xl text-red-500">I</h1>
            <h1 className="text-4xl text-lime-500">S</h1>
            <h1 className="text-4xl text-green-500">E</h1>
            <h1 className="text-4xl text-purple-500">C</h1>
            <h1 className="text-4xl text-orange-500">R</h1>
            <h1 className="text-4xl text-green-500">A</h1>
            <h1 className="text-4xl text-purple-500">C</h1>
            <h1 className="text-4xl text-lime-500">K</h1>
            <h1 className="text-4xl text-red-500">Z</h1>
          </div>
          <h3 className="text-xl text-white p-10">Game ID: {gameID}</h3>
          <div className="bg-white text-xl font-bold rounded p-1">
            <button onClick={(e) => startGame()}>Start Game</button>
          </div>
          <div className="text-white flex flex-row ">
            {peopleConnected &&
            peopleConnected.map &&
            peopleConnected.map.length > 0 ? (
              peopleConnected.map((msg, index) => (
                <div
                  className="text-white bg-yellow-500 p-5 m-10 rounded"
                  key={"msg-" + index}
                >
                  {msg}
                </div>
              ))
            ) : (
              <div>No messages</div>
            )}
          </div>
        </div>
      )}
      {playing && host && (

      
        <div className="Game">
           <div className="m-10">
              <p className=" items-center justify-center flex text-white font-bold rounded-full w-16 h-16 bg-green-500 ">
                {displayTime()}
              </p>
            </div>
          {!juding&&(
          <div>
           
           <div><a className="bg-orange-500 text-white text-lg p-5 rounded">
                  {promptdisplay}
                </a></div>

          </div>
          )}

          {juding&&(

            <div>
            <div className="text-white font-bold text-xl">Time to VOTE!!</div>
            <div className="text-white flex flex-row ">
            {displayResposes &&
            displayResposes.map &&
            displayResposes.map.length > 0 ? (
              displayResposes.map((msg, index) => (
                <div
                  className="text-white bg-green-500 p-5 m-10 rounded"
                  key={"msg-" + index}
                >
                  {msg}
                </div>
              ))
            ) : (
              <div>No messages</div>
            )}
          </div>
            </div>
            
          )}
        </div>
      )}
    </div>
  );
};

export default App;
