// src/AboutUs.js
// src/AboutUs.js

import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

const AboutUs = () => {
  return (
    <Box maxW="800px" mx="auto" mt="50px">
      <Heading as="h1" mb="6">About Us</Heading>
      <Text mb="4">
        Welcome to Research Paper Analayzer, your number one tool for simplifying and summarizing complex research papers.
        We are dedicated to providing you with the very best in research analysis, focusing on accuracy, accessibility, and ease of use.
      </Text>
      <Text mb="4">
        Founded in 2024, our application was created to help students, researchers, and professionals quickly understand
        and extract key information from lengthy and complex research papers. Our mission is to make research more accessible
        to everyone, regardless of their expertise in a given field.
      </Text>
      <Text mb="4">
        We hope you enjoy using Research Paper Analayzer as much as we enjoy offering it to you. If you have any questions or comments,
        please don't hesitate to contact us.
      </Text>
    </Box>
  );
};

export default AboutUs;
