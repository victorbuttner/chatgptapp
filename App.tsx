import React, {useState, useEffect} from 'react';
import {GiftedChat} from 'react-native-gifted-chat';
import axios from 'axios';
import NewRelic from 'newrelic-react-native-agent';
import {version} from './package.json';
import {
  AppRegistry,
  Button,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
let appToken;
console.log(Platform.OS);
if (Platform.OS === 'ios') {
  appToken = 'AAe423c8d68cb73e34d1cb7fafde32026e739a4f50-NRMA';
} else {
  appToken = 'AA7bb0104f7f41bb9b01b59ae73efa934a2a3812c1-NRMA';
}
const agentConfiguration = {
  //Android Specific
  // Optional:Enable or disable collection of event data.
  analyticsEventEnabled: true,
  // Optional:Enable or disable crash reporting.
  crashReportingEnabled: true,
  // Optional:Enable or disable interaction tracing. Trace instrumentation still occurs, but no traces are harvested. This will disable default and custom interactions.
  interactionTracingEnabled: true,
  // Optional:Enable or disable reporting successful HTTP requests to the MobileRequest event type.
  networkRequestEnabled: true,
  // Optional:Enable or disable reporting network and HTTP request errors to the MobileRequestError event type.
  networkErrorRequestEnabled: true,
  // Optional:Enable or disable capture of HTTP response bodies for HTTP error traces, and MobileRequestError events.
  httpRequestBodyCaptureEnabled: true,
  // Optional:Enable or disable agent logging.
  loggingEnabled: true,
  // Optional:Specifies the log level. Omit this field for the default log level.
  // Options include: ERROR (least verbose), WARNING, INFO, VERBOSE, AUDIT (most verbose).
  logLevel: NewRelic.LogLevel.INFO,
  // iOS Specific
  // Optional:Enable/Disable automatic instrumentation of WebViews
  webViewInstrumentation: true,
  // Optional:Set a specific collector address for sending data. Omit this field for default address.
  // collectorAddress: "",
  // Optional:Set a specific crash collector address for sending crashes. Omit this field for default address.
  // crashCollectorAddress: "",
  // Optional:Enable or disable reporting data using different endpoints for US government clients
  // fedRampEnabled: false
};

NewRelic.startAgent(appToken, agentConfiguration);
NewRelic.setJSAppVersion(version);
AppRegistry.registerComponent('ChatGPTApp', () => App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginBottom: 20,
    width: '100%',
  },
  error: {
    // Adicione esta nova definição de estilo
    color: 'red',
    textAlign: 'center',
    padding: 10,
  },
  // Outros estilos podem ser adicionados aqui
});
const WelcomeScreen = ({onSubmitUsername}) => {
  const [username, setUsername] = useState('');

  const simulateCrash = () => {
    NewRelic.crashNow('This is a test crash');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter your username..."
        value={username}
        onChangeText={setUsername}
      />
      <Button title="Enter Chat" onPress={() => onSubmitUsername(username)} />
      <Button title="Simulate Crash" onPress={simulateCrash} />
    </View>
  );
};

const App = () => {
  const [user, setUser] = useState(null); // Adiciona esta linha para declarar o estado do usuário
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (user) {
      setMessages([
        {
          _id: 1,
          text: `Olá ${user.name}! Como posso te ajudar hoje?`,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'ChatGPT',
          },
        },
      ]);
    }
  }, [user]);

  const onSend = async (newMessages = []) => {
    setMessages(GiftedChat.append(messages, newMessages));
    const message = newMessages[0].text;

    NewRelic.setAttribute('username', user ? user.name : 'undefined');

    NewRelic.recordBreadcrumb('MessageSent', {
      message: message,
      username: user ? user.name : 'undefined',
    });

    console.log('message', {
      source: 'UserMessage',
      text: message,
      user: user ? user.name : 'undefined',
    });

    if (message.toLowerCase().includes('erro')) {
      // Lança uma exceção que você pode capturar e tratar
      setErrorMessage('Um erro foi detectado em sua mensagem.');
      throw new Error('Uma mensagem de erro foi detectada.');
    }
    if (message.toLowerCase().includes('exception')) {
      // Lança uma exceção que você pode capturar e tratar
      throw new Error('Uma mensagem de erro foi detectada.');
    }
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

      NewRelic.recordCustomEvent('OpenAIResponse', 'message', {
        replies,
        username: user ? user.name : 'undefined',
      });

      console.log('message', {
        source: 'OpenAIResponse',
        text: replies,
        user: user ? user.name : 'undefined',
      });

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
      NewRelic.recordError(new Error(String(error)));
      console.error(error);
    }
  };
  const onSubmitUsername = username => {
    // Quando um username é submetido, atualize o estado do usuário
    setUser({
      _id: 1,
      name: username,
    });

    NewRelic.setUserId(username);
  };

  if (!user) {
    return <WelcomeScreen onSubmitUsername={onSubmitUsername} />;
  }

  return (
    <>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <GiftedChat
        messages={messages}
        onSend={newMessages => onSend(newMessages)}
        user={{
          _id: 1,
        }}
      />
    </>
  );
};

export default App;
