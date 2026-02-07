import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, push, serverTimestamp, update, get } from 'firebase/database';
import './chat.css';

// Help center chat references
const HELP_CENTER_CHAT_REF = 'HelpCenterChat';
const HELP_CENTER_RIDER_REF = 'HelpCenterRider';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch all users from both HelpCenterChat and HelpCenterRider
    const fetchAllUsers = async () => {
      try {
        // Get users from HelpCenterChat
        const helpCenterSnap = await get(ref(db, HELP_CENTER_CHAT_REF));
        const helpCenterData = helpCenterSnap.val() || {};

        // Get users from HelpCenterRider
        const helpCenterRiderSnap = await get(ref(db, HELP_CENTER_RIDER_REF));
        const helpCenterRiderData = helpCenterRiderSnap.val() || {};

        // Combine all user IDs from both databases
        const allUserIds = new Set([
          ...Object.keys(helpCenterData),
          ...Object.keys(helpCenterRiderData)
        ]);

        const userPromises = Array.from(allUserIds).map(async (userId) => {
          // Get user profile info
          let userProfile = { id: userId, name: `User ${userId.slice(-6)}` };
          
          try {
            const userSnap = await get(ref(db, `usersAccount/${userId}`));
            if (userSnap.exists()) {
              const userData = userSnap.val();
              userProfile.name = userData.userName || userData.email || `User ${userId.slice(-6)}`;
              userProfile.email = userData.email;
              userProfile.photo = userData.userPhotoURL;
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }

          // Get last message for this user from both databases
          let lastMessage = '';
          let lastTimestamp = 0;
          let messageSource = '';
          let isRider = false;

          // Check HelpCenterChat (regular users)
          if (helpCenterData[userId]) {
            const messagesSnap = await get(ref(db, `${HELP_CENTER_CHAT_REF}/${userId}/messages`));
            if (messagesSnap.exists()) {
              const messages = messagesSnap.val();
              Object.entries(messages).forEach(([msgId, msg]) => {
                if (msg.createdAt > lastTimestamp) {
                  lastTimestamp = msg.createdAt;
                  lastMessage = msg.message || msg.text || '';
                  messageSource = 'HelpCenterChat';
                }
              });
            }
          }

          // Check HelpCenterRider (rider app users)
          if (helpCenterRiderData[userId]) {
            const messagesSnap = await get(ref(db, `${HELP_CENTER_RIDER_REF}/${userId}/messages`));
            if (messagesSnap.exists()) {
              const messages = messagesSnap.val();
              Object.entries(messages).forEach(([msgId, msg]) => {
                if (msg.createdAt > lastTimestamp) {
                  lastTimestamp = msg.createdAt;
                  lastMessage = msg.message || msg.text || '';
                  messageSource = 'HelpCenterRider';
                  isRider = true; // Mark as rider if they have messages in HelpCenterRider
                }
              });
            }
          }

          // If user exists in both, prioritize HelpCenterRider (rider app)
          if (helpCenterData[userId] && helpCenterRiderData[userId]) {
            messageSource = 'HelpCenterRider';
            isRider = true;
          }

          return {
            ...userProfile,
            lastMessage,
            timestamp: lastTimestamp,
            messageSource,
            isRider
          };
        });

        const userList = await Promise.all(userPromises);
        const sortedUsers = userList
          .filter(user => user.lastMessage) // Only show users with messages
          .sort((a, b) => b.timestamp - a.timestamp);
        setRiders(sortedUsers);
        
        // Store user profiles for quick access
        const profiles = {};
        sortedUsers.forEach(user => {
          profiles[user.id] = user;
        });
        setUserProfiles(profiles);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (selectedRider) {
      // Listen for messages from selected user from both databases
      const helpCenterMessagesRef = ref(db, `${HELP_CENTER_CHAT_REF}/${selectedRider.id}/messages`);
      const helpCenterRiderMessagesRef = ref(db, `${HELP_CENTER_RIDER_REF}/${selectedRider.id}/messages`);
      
      let allMessages = [];
      
      const unsubscribeHelpCenter = onValue(helpCenterMessagesRef, (snapshot) => {
        const data = snapshot.val();
        const messages = data ? Object.entries(data)
          .map(([id, msg]) => ({
            id,
            ...msg,
            createdAt: msg.createdAt || 0,
            source: 'HelpCenterChat'
          }))
          .sort((a, b) => a.createdAt - b.createdAt) : [];
        
        // Combine with existing messages from other source
        const otherSourceMessages = allMessages.filter(msg => msg.source !== 'HelpCenterChat');
        allMessages = [...otherSourceMessages, ...messages].sort((a, b) => a.createdAt - b.createdAt);
        setMessages(allMessages);
      });

      const unsubscribeHelpCenterRider = onValue(helpCenterRiderMessagesRef, (snapshot) => {
        const data = snapshot.val();
        const messages = data ? Object.entries(data)
          .map(([id, msg]) => ({
            id,
            ...msg,
            createdAt: msg.createdAt || 0,
            source: 'HelpCenterRider'
          }))
          .sort((a, b) => a.createdAt - b.createdAt) : [];
        
        // Combine with existing messages from other source
        const otherSourceMessages = allMessages.filter(msg => msg.source !== 'HelpCenterRider');
        allMessages = [...otherSourceMessages, ...messages].sort((a, b) => a.createdAt - b.createdAt);
        setMessages(allMessages);
      });

      return () => {
        unsubscribeHelpCenter();
        unsubscribeHelpCenterRider();
      };
    } else {
      setMessages([]);
    }
  }, [selectedRider]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && selectedRider) {
      const messageData = {
        senderId: 'admin', // Admin as sender
        text: newMessage.trim(), // Use 'text' field like rider app
        createdAt: Date.now(),
        userPhotoURL: 'https://example.com/admin-avatar.jpg' // Optional admin avatar
      };

      try {
        if (selectedRider.isRider) {
          // Send to HelpCenterRider only for rider app users
          const helpCenterRiderRef = ref(db, `${HELP_CENTER_RIDER_REF}/${selectedRider.id}/messages`);
          await push(helpCenterRiderRef, messageData);
        } else {
          // Send to HelpCenterChat for regular user app users
          const helpCenterRef = ref(db, `${HELP_CENTER_CHAT_REF}/${selectedRider.id}/messages`);
          await push(helpCenterRef, {
            ...messageData,
            message: newMessage.trim() // Also include 'message' field for compatibility
          });
        }
        
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
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
        <h2>Help Center Chat</h2>
      </div>
      
      <div className="chat-content">
        {/* Users List */}
        <div className="riders-list">
          <h3>Users</h3>
          {riders.length === 0 ? (
            <p className="no-riders">No user messages yet</p>
          ) : (
            riders.map(user => (
              <div
                key={user.id}
                className={`rider-item ${selectedRider?.id === user.id ? 'active' : ''}`}
                onClick={() => setSelectedRider(user)}
              >
                <div className="rider-info">
                  <div className="rider-name">
                    {user.name}
                    {user.isRider && <span className="user-type-badge">Rider</span>}
                  </div>
                  <div className="last-message">{user.lastMessage}</div>
                </div>
                <div className="rider-time">
                  {formatTime(user.timestamp)}
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
                {selectedRider.email && <p className="user-email">{selectedRider.email}</p>}
              </div>
              
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">No messages yet with this user</div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`message ${message.senderId === 'admin' ? 'admin-message' : 'user-message'}`}
                    >
                      <div className="message-content">
                        {message.message || message.text}
                      </div>
                      <div className="message-time">
                        {formatTime(message.createdAt)}
                        {message.source && (
                          <span className="message-source"> ({message.source})</span>
                        )}
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
                  placeholder="Type your reply..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="select-rider">
              <p>Select a user to view their messages and reply</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
