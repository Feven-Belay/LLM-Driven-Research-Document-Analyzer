import React, { useState } from 'react';
import axios from 'axios';
import './Signup.css'; // Make sure this CSS file exists and styles your form correctly

function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [message, setMessage] = useState('');

    // Handle changes in the form inputs
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('Processing...'); // Display a processing message
        try {
            // Post data to the server
            const response = await axios.post('http://127.0.0.1:5000/signup', formData);
            // Use response data to enhance the success message
            setMessage(`Signup successful! Welcome, ${response.data.name}. Please login.`);
            setFormData({ name: '', email: '', password: '' }); // Clear form after successful signup
        } catch (error) {
            // Handle errors if the server response was not OK
            setMessage(error.response ? error.response.data.message : 'Failed to sign up.');
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit} className="signup-form">
                <input 
                    type="text" 
                    name="name" 
                    placeholder="Name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="email" 
                    name="email" 
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                />
                <input 
                    type="password" 
                    name="password" 
                    placeholder="Password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                />
                <button type="submit" className="signup-button">Sign Up</button>
                {message && <p className="message">{message}</p>}
            </form>
            <div className="login-link">
                Already have an account? <a href="/login">Login here</a>
            </div>
        </div>
    );
}

export default Signup;