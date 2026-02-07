import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, push, serverTimestamp, update } from 'firebase/database';
import './chat.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch riders who have sent messages
    const ridersRef = ref(db, 'riderMessages');
    const unsubscribeRiders = onValue(ridersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const riderList = Object.keys(data).map(riderId => ({
          id: riderId,
          name: data[riderId].riderName || `Rider ${riderId}`,
          lastMessage: data[riderId].lastMessage || '',
          timestamp: data[riderId].lastTimestamp || 0
        }));
        setRiders(riderList);
      }
      setLoading(false);
    });

    return () => unsubscribeRiders();
  }, []);

  useEffect(() => {
    if (selectedRider) {
      // Listen for messages from selected rider
      const messagesRef = ref(db, `riderMessages/${selectedRider.id}/messages`);
      const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messageList = Object.entries(data)
            .map(([id, msg]) => ({
              id,
              ...msg,
              timestamp: msg.timestamp || 0
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
          setMessages(messageList);
        } else {
          setMessages([]);
        }
      });

      return () => unsubscribeMessages();
    }
  }, [selectedRider]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedRider) {
      const messageData = {
        text: newMessage.trim(),
        sender: 'admin',
        timestamp: serverTimestamp()
      };

      try {
        const messagesRef = ref(db, `riderMessages/${selectedRider.id}/messages`);
        await push(messagesRef, messageData);
        
        // Update last message info
        const riderRef = ref(db, `riderMessages/${selectedRider.id}`);
        await update(riderRef, {
          lastMessage: newMessage.trim(),
          lastTimestamp: serverTimestamp(),
          adminLastRead: serverTimestamp()
        });
        
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Rider Chat Support</h2>
      </div>
      
      <div className="chat-content">
        {/* Riders List */}
        <div className="riders-list">
          <h3>Conversations</h3>
          {riders.length === 0 ? (
            <p className="no-riders">No rider conversations yet</p>
          ) : (
            riders.map(rider => (
              <div
                key={rider.id}
                className={`rider-item ${selectedRider?.id === rider.id ? 'active' : ''}`}
                onClick={() => setSelectedRider(rider)}
              >
                <div className="rider-info">
                  <div className="rider-name">{rider.name}</div>
                  <div className="last-message">{rider.lastMessage}</div>
                </div>
                <div className="rider-time">
                  {formatTime(rider.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedRider ? (
            <>
              <div className="chat-header-info">
                <h3>{selectedRider.name}</h3>
              </div>
              
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">No messages yet. Start a conversation!</div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`message ${message.sender === 'admin' ? 'admin-message' : 'rider-message'}`}
                    >
                      <div className="message-content">
                        {message.text}
                      </div>
                      <div className="message-time">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="message-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="select-rider">
              <p>Select a rider to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
