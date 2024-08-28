import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, useToast, Text, Link, useColorModeValue } from '@chakra-ui/react';
import axios from 'axios'; // Import axios for HTTP requests

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const toast = useToast();
  
  // Determine the text color, background color, and placeholder color based on the current color mode
  const inputTextColor = useColorModeValue('black', 'white');
  const inputBgColor = useColorModeValue('white', 'gray.800');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const formBgColor = useColorModeValue('white', 'gray.700');  // Adjust form background if needed

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isNewUser && (!name || !email || !password)) {
      toast({
        title: "Error",
        description: "Please fill out all fields.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!isNewUser && (!name || !password)) {
      toast({
        title: "Error",
        description: "Please enter your name and password.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      let response;
      if (isNewUser) {
        // Sign-up request
        response = await axios.post('http://127.0.0.1:5000/signup', { name, email, password });
        toast({
          title: "Account Created",
          description: `Account created for ${name}.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Login request
        response = await axios.post('http://127.0.0.1:5000/login', { name, password });
        toast({
          title: "Login Successful",
          description: `Welcome back, ${name}.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
      onLogin(name); // Call the onLogin function passed as a prop
    } catch (error) {
      toast({
        title: "Error",
        description: error.response ? error.response.data.message : 'An error occurred.',
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <div id="login-container">
      <Box as="form" onSubmit={handleSubmit} bg={formBgColor} p={6} borderRadius="md" boxShadow="md">
        <VStack spacing={4}>
          <FormControl id="name" isRequired>
            <FormLabel>Name</FormLabel>
            <Input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your name" 
              color={inputTextColor} 
              bg={inputBgColor} 
              _placeholder={{ color: placeholderColor }} 
            />
          </FormControl>

          {isNewUser && (
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email" 
                color={inputTextColor} 
                bg={inputBgColor} 
                _placeholder={{ color: placeholderColor }} 
              />
            </FormControl>
          )}

          <FormControl id="password" isRequired>
            <FormLabel>Password</FormLabel>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your password" 
              color={inputTextColor} 
              bg={inputBgColor} 
              _placeholder={{ color: placeholderColor }} 
            />
          </FormControl>

          <Button type="submit" colorScheme="teal" width="full">
            {isNewUser ? 'Create Account' : 'Login'}
          </Button>

          <Text fontSize="sm">
            {isNewUser ? (
              <>
                Already have an account?{' '}
                <Link color="teal.500" onClick={() => setIsNewUser(false)}>
                  Login here
                </Link>
              </>
            ) : (
              <>
                New user?{' '}
                <Link color="teal.500" onClick={() => setIsNewUser(true)}>
                  Create an account
                </Link>
              </>
            )}
          </Text>
        </VStack>
      </Box>
    </div>
  );
}

export default Login;