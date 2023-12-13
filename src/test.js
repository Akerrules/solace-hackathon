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
} from "react-router-dom";
import Game from "./game.js";
/**
 * App is the main entrypoint of the react app. It contains a Solace Client
 * that can be connected and disconnected, and used to send and receive messages
 */
// ... (your imports)

const Test = () => {
  const [connected, setConnected] = useState(false);
  const [messageBody, setMessageBody] = useState("Aditya joined");
  const [messages, setMessages] = useState([]);
  const [gameID, setGameID] = useState("");
  const [myGameid, setMyGameid] = useState("");
  const [host, setHost] = useState(false);

  const componentMounted = useRef(false);

  const client = useRef(
    new Client(
      (event) => setConnected(true),
      (event) =>
        alert("Something went wrong: API disconnected: " + event.reason)
    )
  );
  const navigate = useNavigate();
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

  const publish = () => {
    console.log("game/" + gameID);
    client.current.publish("game/" + gameID, messageBody);
  };

  const onMessage = (topic, message) => {
    console.info("Received message: " + message.dump());
    setMessages([message.getBinaryAttachment(), ...messages]);
  };

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/game" element={<Game />} />
        </Routes>
      </Router>
      <header className="App-header">
        <div className="pubsub-container">
          <div className="pubsub-component">
            <h3>Publisher</h3>
            <div>
              Game ID:{" "}
              <input
                type="text"
                value={gameID}
                onChange={(e) => setGameID(e.target.value)}
              />
            </div>
            <button onClick={publish}>Join</button>
          </div>

          <div className="pubsub-component">
            <h3>Your Game ID</h3>
            <div>Game ID: {myGameid}</div>
            <button>Go to Game</button>
          </div>

          <div className="pubsub-component">
            <h3>Received Messages</h3>
            {messages.map((msg, index) => (
              <div className="message" key={"msg-" + index}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;
