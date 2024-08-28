import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Button, Input, Box, Heading, Text, Spinner, VStack, FormControl, FormLabel, Flex, useToast,
  useColorMode, useColorModeValue, Link, HStack, IconButton, Select // Import Select from Chakra UI
} from '@chakra-ui/react';
import { AttachmentIcon, DeleteIcon } from '@chakra-ui/icons';
import './App.css';
import { Route, Routes, useLocation } from 'react-router-dom';

import Login from './Login';
import Settings from './Settings';
import ContactUs from './ContactUs';  
import AboutUs from './AboutUs';  

function App() {
  const [file, setFile] = useState(null);
  const { colorMode, toggleColorMode } = useColorMode(); 
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('black', 'white');
  const cardBgColor = useColorModeValue('gray.100', 'gray.700');
  const [summaries, setSummaries] = useState([]);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [model, setModel] = useState('gpt-3.5-turbo'); // Moved inside the App function

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || '';
  });
  const [chats, setChats] = useState(() => {
    return JSON.parse(localStorage.getItem('chats')) || []; // Load saved chats from localStorage
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    return chats.length > 0 ? chats[chats.length - 1].id : null; // Start with the last chat
  });
  const toast = useToast();
  const bottomRef = useRef(null);
  const location = useLocation(); 

  const handleLogin = (name) => {
    setUsername(name);
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', name);
    toast({
      title: "Login Successful",
      description: `Welcome, ${name}!`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    toast({
      title: "Logout Successful",
      description: "You have been logged out.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  useEffect(() => {
    if (answers.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [answers]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('chats', JSON.stringify(chats));
    }
  }, [chats]);

  const saveChat = () => {
    if (currentChatId !== null) {
      const updatedChats = chats.map(chat => {
        if (chat.id === currentChatId) {
          return { ...chat, summaries, answers };
        }
        return chat;
      });
      setChats(updatedChats);
    }
  };

  const createNewChat = () => {
    saveChat();  // Save the current chat before creating a new one
    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      title: `Chat ${chats.length + 1}`,
      summaries: [],
      answers: [],
    };
    setChats(prevChats => [...prevChats, newChat]);
    setSummaries([]);
    setAnswers([]);
    setCurrentChatId(newChatId);
  };

  const loadChat = (id) => {
    saveChat();  // Save the current chat before loading a new one
    const chat = chats.find(c => c.id === id);
    if (chat) {
      setSummaries(chat.summaries);
      setAnswers(chat.answers);
      setCurrentChatId(id);
    }
  };

  const deleteChat = (id) => {
    const updatedChats = chats.filter(chat => chat.id !== id);
    setChats(updatedChats);

    if (currentChatId === id) {
      // If the deleted chat was the current one, clear the display
      setSummaries([]);
      setAnswers([]);
      setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    }

    localStorage.setItem('chats', JSON.stringify(updatedChats));
    toast({
      title: "Chat deleted",
      description: "The chat has been successfully deleted.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const deleteAllChats = () => {
    setChats([]);
    setSummaries([]);
    setAnswers([]);
    setCurrentChatId(null);
    localStorage.removeItem('chats');  // Clear from localStorage
    toast({
      title: "All chats deleted",
      description: "All chats have been successfully deleted.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);  // Send the selected model
  
    setLoading(true);
  
    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      if (response.data.summaries) {
        setSummaries(response.data.summaries);
      } else if (response.data.summary) {
        setSummaries([{ file: file.name, summary: response.data.summary }]);
      } else {
        console.error('Unexpected response format', response.data);
      }
      toast({
        title: "Upload successful",
        description: "Your file has been uploaded and summarized.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };



  const handleAnswer = async () => {
    if (!question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter a question before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
  
    const context = summaries.map(summary => summary.summary).join('\n');
    setLoading(true);
  
    try {
      const response = await axios.post('http://127.0.0.1:5000/answer', {
        context, 
        question,
        model  // Ensure this is being set correctly elsewhere in your component
      });
      
      if (response.data.answer) {
        setAnswers(prevAnswers => [
          ...prevAnswers,
          { question, answer: response.data.answer }
        ]);
      } else {
        throw new Error('Server responded without an answer');
      }
    } catch (error) {
      console.error('Error fetching answer:', error);
      toast({
        title: "Error fetching answer",
        description: "There was an error fetching the answer to your question.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setQuestion('');  // Reset question input after submission
    }
  };
  

  const navLinkColor = colorMode === 'light' ? 'blue.600' : 'white';

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Flex bg={bgColor} color={textColor} minHeight="100vh" flexDirection="column">
      <Flex as="nav" className="navbar" justifyContent="flex-end" alignItems="center" bg={cardBgColor} p={4} position="sticky" top={0} zIndex={1}>
        <Flex>
          <Link href="/" className="navbar-link" color={navLinkColor} mr={4}>Home</Link>
          <Link href="/contact" className="navbar-link" color={navLinkColor} mr={4}>Contact Us</Link>
          <Link href="/settings" className="navbar-link" color={navLinkColor} mr={4}>Settings</Link>
          <Link href="/about" className="navbar-link" color={navLinkColor}>About</Link>
        </Flex>
        <Button onClick={toggleColorMode} ml={4}>
          Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
        </Button>
        <Flex alignItems="center" ml={4}>
          <Text mr={4}>Welcome, {username}</Text>
          <Button className="login-button" onClick={handleLogout}>
            Logout
          </Button>
        </Flex>
      </Flex>

      <Flex flex="1" mt={4}>
        {location.pathname === '/' && ( // Only render this sidebar on the homepage
          <Box className="sidebar" w="250px" p={4} bg={cardBgColor}>
            <Button colorScheme="teal" onClick={createNewChat} mb={4}>
              New Chat
            </Button>
            <VStack align="start" spacing={3}>
              {chats.map(chat => (
                <HStack key={chat.id} width="100%" spacing={2}>
                  <Button
                    onClick={() => loadChat(chat.id)}
                    colorScheme={currentChatId === chat.id ? 'teal' : 'gray'}
                    flex="1"
                    textAlign="left"
                  >
                    {chat.title}
                  </Button>
                  <IconButton
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="sm"
                    onClick={() => deleteChat(chat.id)}
                    aria-label="Delete chat"
                  />
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        <Box flex="1" p={8} ml="200px">
          <Routes>
            <Route path="/settings" element={<Settings deleteAllChats={deleteAllChats} />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/about" element={<AboutUs />} />
            <Route
              path="/"
              element={
                <Container id="content">
                  <Heading as="h1" size="lg" mb={6} textAlign="center" color="teal.500">
                    Welcome, {username}
                  </Heading>
                  <Heading as="h1" size="lg" mb={6} textAlign="center" color="teal.500">
                    Research Paper Analayzer
                  </Heading>

                  <VStack spacing={4} align="stretch">
                    {loading && <Spinner size="lg" alignSelf="center" />}

                    {summaries.length > 0 && (
                      <Box bg={cardBgColor} p={4} borderRadius="md" fontSize="smaller">
                        <Heading as="h2" size="md" mb={4} color={textColor}>
                          Summaries
                        </Heading>
                        {summaries.map((summary, index) => (
                          <Box key={index} className="summary-box" bg={cardBgColor} p={4} borderRadius="md" fontSize="smaller">
                            <Heading as="h3" size="sm" mb={2} color={textColor}>
                              {summary.file}
                            </Heading>
                            <pre style={{ color: textColor }}>
                              {JSON.stringify({ summary: summary.summary }, null, 2)}
                            </pre>
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Box bg={cardBgColor} p={4} borderRadius="md" mb={8} fontSize="smaller">
                      <Heading as="h2" size="md" mb={4} color={textColor}>
                        Questions and Answers
                      </Heading>
                      {answers.map((qa, index) => (
                        <Box key={index} className="qa-box" bg={cardBgColor} p={4} borderRadius="md" mb={4} fontSize="smaller">
                          <Text color={textColor}>
                            <strong>Question:</strong> {qa.question}
                          </Text>
                          <Text color={textColor}>
                            <strong>Answer:</strong>
                          </Text>
                          <pre style={{ color: textColor }}>
                            {JSON.stringify({ answer: qa.answer }, null, 2)}
                          </pre>
                        </Box>
                      ))}
                      <div ref={bottomRef} />
                    </Box>
                  </VStack>
                </Container>
              }
            />
          </Routes>
        </Box>
      </Flex>

      {location.pathname === '/' && ( // Only render the footer on the homepage
        <Box id="bottom-bar" mt="auto" bg={bgColor} position="sticky" bottom={0} zIndex={1} p={4} width="calc(100% - 250px)" ml="250px">
          <Container maxW="container.lg" p={0}>
            {/* <Flex mb={4} align="center" justify="flex-start" alignItems="flex-start">
              <FormControl flex="1" mr={2}>
                <Input type="file" onChange={handleFileChange} hidden id="file-upload" />
                <FormLabel htmlFor="file-upload" mb={0}>
                  <Button
                    as="span"
                    leftIcon={<AttachmentIcon />}
                    className="upload-button"
                    colorScheme="teal"
                  >
                    Upload PDF
                  </Button>
                </FormLabel>
              </FormControl>

              <FormControl id="model" mb={4}>
                <FormLabel>Select Model</FormLabel>
                <Select value={model} onChange={(e) => setModel(e.target.value)}>
                  <option value="gpt-4">Chat-GPT 4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
                  <option value="t5-base">T5 Base</option>
                </Select>
              </FormControl>
  
              <Button id="summarize-button" onClick={handleUpload} isLoading={loading}>
                Summarize
              </Button>
            </Flex> */}


            <Flex align="center" justify="space-between">
              <HStack spacing={4} flex="1">
                <FormControl>
                  <Input type="file" onChange={handleFileChange} hidden id="file-upload" />
                  <FormLabel htmlFor="file-upload" mb={0}>
                    <Button
                      as="span"
                      leftIcon={<AttachmentIcon />}
                      className="upload-button"
                      colorScheme="teal"
                    >
                      Upload PDF
                    </Button>
                  </FormLabel>
                </FormControl>

                <FormControl id="model" maxW="300px">
                  <FormLabel>Select Model</FormLabel>
                  <Select value={model} onChange={(e) => setModel(e.target.value)}>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
                    <option value="t5-base">T5 Base</option>
                  </Select>
                </FormControl>
              </HStack>

              <Button id="summarize-button" onClick={handleUpload} isLoading={loading} ml={4}>
                Summarize
              </Button>
            </Flex>


            <Flex id="ask-question-container" align="center" justify="flex-start" alignItems="flex-start">
              <Input
                type="text"
                id="ask-question-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the summaries"
                size="lg"
              />
              <Button id="ask-question-button" onClick={handleAnswer}>
                Get Answer
              </Button>
            </Flex>
          </Container>
        </Box>
      )}
    </Flex>
  );
}

export default App;
