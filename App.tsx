import React, {useState, useEffect} from 'react';
import {GiftedChat} from 'react-native-gifted-chat';
import axios from 'axios';

const App = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Olá! como posso te ajudar hoje?',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'ChatGPT',
        },
      },
    ]);
  }, []);

  const onSend = async (newMessages = []) => {
    setMessages(GiftedChat.append(messages, newMessages));
    const message = newMessages[0].text;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions', // Endpoint da API de Chat Completions
        {
          model: 'gpt-3.5-turbo', // Especifique o modelo que você deseja usar
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Bearer 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', // Sua chave de API
          },
        },
      );
      const replies = response.data.choices[0].message.content.trim();

      setMessages(prevMessages =>
        GiftedChat.append(prevMessages, {
          _id: Math.round(Math.random() * 1000000),
          text: replies,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'ChatGPT',
          },
        }),
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <GiftedChat
      messages={messages}
      onSend={newMessages => onSend(newMessages)}
      user={{
        _id: 1,
      }}
    />
  );
};

export default App;
