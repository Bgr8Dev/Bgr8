const { openai } = require('../config/openaiConfig');
const { db } = require('../config/firebaseConfig');
const { client } = require('../config/twilioConfig');
const admin = require('firebase-admin');
const { generateGoogleAuthLink } = require('./authController');

/**
 * Initialize a new conversation session.
 * Generates a session ID and creates an empty session document in Firestore.
 */
async function initializeSession(req, res) {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) throw new Error('No token provided');

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Generate a session ID (ISO date-time)
    const sessionId = new Date().toISOString();
    const conversationRef = db
      .collection('users')
      .doc(userId)
      .collection('conversations')
      .doc(sessionId);

    // Initialize the session document
    await conversationRef.set({
      startedAt: new Date(),
      messages: [],
    });

    res.status(200).json({ sessionId }); // Return the session ID
  } catch (error) {
    console.error('Error initializing session:', error);
    res.status(500).json({ error: 'Error initializing session' });
  }
}

/**
 * Handle incoming chat messages.
 * Saves messages in the session initialized earlier.
 * 
 */
async function handleChat(req, res) {
    const { Body, From, sessionId } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];
  
    try {
        let userId
    
        if (From === 'web-client') {
          if (!idToken) {
            throw new Error('No token provided for web-client.');
          }
    
          // Verify the ID token to get the user's UID
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          userId = decodedToken.uid;
          console.log(`Resolved userId for web-client: ${userId}`);
        } else if (From.startsWith('whatsapp:')) {
          const cleanNumber = From.replace('whatsapp:', '');
          // Check if the number is registered
          const registeredNumberRef = db.collection('registered_numbers').doc(cleanNumber);
          const registeredNumberDoc = await registeredNumberRef.get();
      
          if (!registeredNumberDoc.exists) {
              // If the number is not registered, prompt for Google login
              const googleAuthLink = generateGoogleAuthLink(cleanNumber);
              const menuMessage = "TheraBot Commands:\n- Type 'website' to recieve a link to the website. \n- Type 'end conversation' to end the current session.\n- Type 'menu' to view this message again.\n- Type 'profile' to view Profile.\n- Type 'settings' to view Settings.";
              const loginMessage = `Welcome to TheraBot! To continue, please log in using Google: ${googleAuthLink} \n ${menuMessage}`;
      
              await client.messages.create({
              from: process.env.TWILIO_WHATSAPP_NUMBER,
              to: From,
              body: loginMessage,
              });
      
              res.status(200).send('Login link sent.');
              return;
          }
      
          // Retrieve the UID from the registered number
          const { uid } = registeredNumberDoc.data();
          userId = uid; // Use the UID for further operations
        } else {
          throw new Error('Invalid "From" field.');
        }

        // Fetch user preferences
        console.log(`Fetching preferences for userId: ${userId}`);
        const preferencesRef = db.collection('users').doc(userId).collection('settings').doc('preferences');
        const preferencesDoc = await preferencesRef.get();

        let tone = 'empathetic';
        let nickname = 'User';
        let role = 'therapist';

        if (preferencesDoc.exists) {
          const preferences = preferencesDoc.data();
          const personalization = preferences.personalization || {};

          // Destructure with fallback defaults
          tone = personalization.tone || tone;
          nickname = personalization.nickname || nickname;
          role = personalization.role || role;

          console.log(`Fetched preferences:\n Tone: ${tone}\n Role: ${role}\n Nickname: ${nickname}`);
        } else {
          console.log('Preferences document does not exist. Using default values.');
        }

    
        // Check for sessionId or generate one if missing
        let activeSessionId = sessionId;
        if (!activeSessionId) {
            activeSessionId = new Date().toISOString();
            console.log(`Generated sessionId: ${activeSessionId}`);
        }
    
        // Reference to the user's session document
        const conversationRef = db
            .collection('users')
            .doc(userId)
            .collection('conversations')
            .doc(activeSessionId);

        const botSettings = {
          tone: tone || 'empathetic',
          nickname: nickname || 'User',
          role: role || 'therapist',
        };
    
        // Check if session exists, initialize if it doesn't
        const sessionDoc = await conversationRef.get();
        if (!sessionDoc.exists) {
            await conversationRef.set({
            startedAt: new Date(),
            messages: [],
            botSettings,
            });
        }
        // Command Handling
        const lowerBody = Body.trim().toLowerCase();
        if (lowerBody === "end conversation") {
        await conversationRef.update({
            endedAt: new Date(),
        });

        const endMessage = "Your conversation has been ended. You can start a new one anytime by sending a message.";
        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: From,
            body: endMessage,
        });

        res.status(200).json({ reply: endMessage });
        return;
        } else if (lowerBody === "menu") {
        const menuMessage = "TheraBot Commands:\n- Type 'website' to recieve a link to the website. \n- Type 'end conversation' to end the current session.\n- Type 'menu' to view this message again.\n- Type 'profile' to view Profile.\n- Type 'settings' to view Settings.";
        await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: From,
            body: menuMessage,
        });

        res.status(200).json({ reply: menuMessage });
        return;
        }
        else if (lowerBody === "profile") {
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
              const userData = userDoc.data();
              const profileMessage = `Your Profile:\n- Name: ${userData.name || 'N/A'}\n- Email: ${userData.email || 'N/A'}\n- Phone: ${userData.phoneNumber || 'N/A'}`;
              await client.messages.create({
                  from: process.env.TWILIO_WHATSAPP_NUMBER,
                  to: From,
                  body: profileMessage,
              });
              res.status(200).json({ reply: profileMessage });
          } else {
              const errorMessage = 'Profile not found.';
              await client.messages.create({
                  from: process.env.TWILIO_WHATSAPP_NUMBER,
                  to: From,
                  body: errorMessage,
              });
              res.status(404).json({ reply: errorMessage });
          }
          return;
        } else if (lowerBody === "settings") {
            const settingsRef = db.collection('users').doc(userId).collection('settings').doc('preferences');
            const settingsDoc = await settingsRef.get();

            if (settingsDoc.exists) {
                const settingsData = settingsDoc.data();
                const settingsPersonalization = settingsData.personalization || {};
                const settingsMessage = `Your Settings:\n- Tone: ${settingsPersonalization.tone || 'Default'}\n- Role: ${settingsPersonalization.role || 'Default'}\n- Nickname: ${settingsPersonalization.nickname || 'Default'}`;
                await client.messages.create({
                    from: process.env.TWILIO_WHATSAPP_NUMBER,
                    to: From,
                    body: settingsMessage,
                });
                res.status(200).json({ reply: settingsMessage });
            } else {
                const errorMessage = 'Settings not found.';
                await client.messages.create({
                    from: process.env.TWILIO_WHATSAPP_NUMBER,
                    to: From,
                    body: errorMessage,
                });
                res.status(404).json({ reply: errorMessage });
            }
            return;
        }
        else if (lowerBody === "website") {
          const websiteMessage = "Visit the TheraBot website at: https://therabot-site.onrender.com";
          await client.messages.create({
              from: process.env.TWILIO_WHATSAPP_NUMBER,
              to: From,
              body: websiteMessage,
          });

          res.status(200).json({ reply: websiteMessage });
          return;
      }    
        // Generate a response using OpenAI
        const systemPrompt = `You are a ${tone || 'supportive'} assistant named TheraBot, acting as a ${role || 'therapist'}.
        Address the user as "${nickname || 'User'}" and maintain a ${tone || 'empathetic'} tone throughout the conversation.`;
      
        // Generate a response using OpenAI
        const openAIResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            {
                role: 'user',
                content: Body,
            },
            ],
        });
    
        const botReply = openAIResponse.choices[0].message.content;
    
        // Append the new message to the session document in Firestore
        await conversationRef.update({
            messages: admin.firestore.FieldValue.arrayUnion({
            userMessage: Body,
            botMessage: botReply,
            timestamp: new Date(),
            }),
        });
    
        // Send the bot's reply via WhatsApp
        if (From.startsWith('whatsapp:')) {
            await client.messages.create({
            from: process.env.TWILIO_WHATSAPP_NUMBER,
            to: From,
            body: botReply,
            });
        }
    
        res.status(200).json({ reply: botReply }); // Return the bot's reply
    } catch (error) {
      console.error('Error handling chat:', error);
  
      // Send an error message via WhatsApp if applicable
      if (From.startsWith('whatsapp:')) {
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to: From,
          body: "Sorry, we encountered an error while processing your message. Please try again later.",
        });
      }
  
      res.status(500).json({ error: 'Error processing message.' });
    }
  }
  
async function fetchHistory(req, res) {
    try {
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        return res.status(401).send('Unauthorized');
      }
  
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const userId = decodedToken.uid;
  
      // Fetch conversations for the user
      const conversationsRef = db
        .collection('users')
        .doc(userId)
        .collection('conversations');
  
      const snapshot = await conversationsRef.get();
  
      const conversations = [];
      snapshot.forEach((doc) => {
        conversations.push({ id: doc.id, ...doc.data() });
      });
  
      res.status(200).json(conversations);
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).send('Error fetching conversation history');
    }
  }
  
module.exports = { initializeSession, handleChat, fetchHistory };
  
