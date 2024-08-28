import React, { useState } from 'react';
import { Box, FormControl, FormLabel, Input, Textarea, Button, Heading, Text, useToast, useColorModeValue } from '@chakra-ui/react';
import emailjs from 'emailjs-com';

const ContactUs = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const toast = useToast();

  // Color mode values
  const inputTextColor = useColorModeValue('black', 'white');
  const inputBgColor = useColorModeValue('white', 'gray.800');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');
  const formBgColor = useColorModeValue('gray.300', 'gray.600'); // Updated form background color to gray
  const boxBgColor = useColorModeValue('gray.200', 'gray.700'); // Added box background color to gray
  const labelTextColor = useColorModeValue('black', 'white'); // Ensure labels are visible in dark mode

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.send(
      'service_4diog1j', // Replace with your EmailJS service ID
      'template_ilt8vr7', // Replace with your EmailJS template ID
      {
        from_name: name,
        from_email: email,
        subject: subject,
        message: message,
      },
      'd2sDKaTdt7AJJIM2p' // Replace with your EmailJS user ID
    ).then((result) => {
      console.log(result.text);
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, (error) => {
      console.log(error.text);
      toast({
        title: "Error",
        description: "There was an error sending your message.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    });
  };

  return (
    <Box w="100%" maxW="600px" mx="auto" mt="40px" p={4} bg={boxBgColor} borderRadius="md"> {/* Box with gray background */}
      <Heading as="h1" mb="6" color={labelTextColor}>Contact Us</Heading>
      
      {/* Instruction for the user */}
      <Text mb="4" color={labelTextColor}>
        Please fill out the form below with your inquiry or feedback, and we will get back to you as soon as possible.
      </Text>
      
      <Box as="form" onSubmit={sendEmail} bg={formBgColor} p={4} borderRadius="md"> {/* Form with gray background */}
        <FormControl id="name" isRequired mb="4">
          <FormLabel color={labelTextColor}>Name</FormLabel>
          <Input 
            placeholder="Your Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            bg={inputBgColor} 
            color={inputTextColor}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>
        <FormControl id="email" isRequired mb="4">
          <FormLabel color={labelTextColor}>Email</FormLabel>
          <Input 
            type="email" 
            placeholder="Your Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            bg={inputBgColor} 
            color={inputTextColor}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>
        <FormControl id="subject" isRequired mb="4">
          <FormLabel color={labelTextColor}>Subject</FormLabel>
          <Input 
            placeholder="Subject" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            bg={inputBgColor} 
            color={inputTextColor}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>
        <FormControl id="message" isRequired mb="4">
          <FormLabel color={labelTextColor}>Message</FormLabel>
          <Textarea 
            placeholder="Your Message" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            bg={inputBgColor} 
            color={inputTextColor}
            _placeholder={{ color: placeholderColor }}
          />
        </FormControl>
        <Button colorScheme="teal" type="submit" w="100%">Send Message</Button>
      </Box>
    </Box>
  );
};

export default ContactUs;
