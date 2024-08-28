

import React from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,

  HStack,

  Select,
  Text,

  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import './Setting.css';

const Settings = ({ deleteAllChats }) => {
  const { colorMode,setColorMode } = useColorMode(); // Access color mode functions
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const textColor = useColorModeValue('black', 'white');

  const selectBgColor = useColorModeValue('gray.100', 'gray.600');


  // Function to handle theme selection
  const handleThemeChange = (e) => {
    const selectedTheme = e.target.value;
    setColorMode(selectedTheme);
  };

  return (
    <Flex height="100vh" color={textColor}>
      {/* Sidebar */}


      {/* Main Content Area */}
      <Box bg={bgColor} flex="1" p={8} color={textColor}>
        <Heading size="lg" mb={6}>General</Heading>

        {/* Theme Setting */}
        <HStack justify="space-between" mb={6} width="60%">
          <Text>Theme</Text>
          <Select
            width="200px"
            bg={selectBgColor}
            color={textColor}
            onChange={handleThemeChange}
            value={colorMode}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </HStack>


        {/* Delete all chats */}
        <HStack justify="space-between" mb={6} width="60%">
          <Text>Delete all chats</Text>
          <Button colorScheme="red" onClick={deleteAllChats}>Delete all</Button>
        </HStack>
      </Box>
    </Flex>
  );
};

export default Settings;
