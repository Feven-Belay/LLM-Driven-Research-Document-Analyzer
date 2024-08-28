
####LATEST ONE
from flask import Flask, request, jsonify
import openai
import os
import zipfile
from PyPDF2 import PdfReader
from flask_cors import CORS
from werkzeug.utils import secure_filename
import docx  # Import the python-docx library
from transformers import T5Tokenizer, T5ForConditionalGeneration, BertTokenizer, BertForQuestionAnswering
import torch
import sentencepiece
from passlib.context import CryptContext
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)



# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL")
ca = certifi.where()
# Set the OpenAI API key from the environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

# Ensure MongoClient is using the correct SSL/TLS parameters
client = MongoClient(MONGODB_URL, tls=True, tlsCAFile=ca)
database = client['Research_analyzer']

documents_collection = database['documents']
summaries_collection = database['summaries']
question_answers_collection = database['question_answers']
# Collection for users
users_collection = database['users']

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Sign-up route
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    # Validate input
    if not data or not 'name' in data or not 'email' in data or not 'password' in data:
        return jsonify({"message": "Missing data"}), 400

    # Check if user already exists
    if users_collection.find_one({"email": data['email']}):
        return jsonify({"message": "User already exists"}), 400

    # Hash the password
    hashed_password = generate_password_hash(data['password'])

    # Create a new user
    user = {
        "name": data['name'],
        "email": data['email'],
        "password": hashed_password
    }

    # Insert user into the database
    user_id = users_collection.insert_one(user).inserted_id

    return jsonify({"message": "Signup successful!", "name": user['name'], "user_id": str(user_id)}), 201

# Login route
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # Validate input
    if not data or not 'name' in data or not 'password' in data:
        return jsonify({"message": "Missing data"}), 400

    # Find the user by email
    user = users_collection.find_one({"name": data['name']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({"message": "Invalid credentials"}), 401

    return jsonify({"message": "Login successful!"}), 200

# Load the T5 model and tokenizer for summarization (only needed for t5-base)
summarization_tokenizer = T5Tokenizer.from_pretrained("t5-base")
summarization_model = T5ForConditionalGeneration.from_pretrained("t5-base")

# Load the BERT model and tokenizer for question answering (only needed for t5-base)
qa_tokenizer = BertTokenizer.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")
qa_model = BertForQuestionAnswering.from_pretrained("bert-large-uncased-whole-word-masking-finetuned-squad")

def extract_text_from_pdf(file_path):
    try:
        with open(file_path, 'rb') as f:
            reader = PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return "Error reading PDF file. It may be corrupted or not a valid PDF."

def extract_text_from_docx(docx_path):
    doc = docx.Document(docx_path)
    text = []
    for paragraph in doc.paragraphs:
        text.append(paragraph.text)
    return ' '.join(text)

def summarize_text(text):
    prompt = (
        "You are a research assistant specialized in summarizing academic papers. "
        "Your task is to provide a concise summary of the following research paper in bullet points, including the author(s), purpose, methodology, key findings, and conclusion. Ensure each bullet point is on a new line. Here is an example of a well-formatted summary:\n\n"

        "Example:\n"
        "Text: 'This study explores the impact of renewable energy adoption on national power grids. The authors conducted a series of simulations to evaluate how different levels of renewable energy integration affect grid stability, reliability, and cost. They found that while renewable energy sources improve sustainability, they also introduce challenges related to grid management and require significant investment in infrastructure. The paper concludes that a balanced approach, combining renewable and traditional energy sources, is necessary to achieve energy security and sustainability. The study was authored by Jane Doe and John Smith.'\n"
        "Summary:\n"
        "- **Author(s):** Jane Doe and John Smith\n"
        "- **Purpose:** Assess impact of renewable energy on power grids.\n"
        "- **Methodology:** Simulations of renewable energy integration.\n"
        "- **Key Findings:** Renewable energy improves sustainability but poses grid management challenges and needs substantial investment.\n"
        "- **Conclusion:** A balanced approach of renewable and traditional energy is needed for security and sustainability.\n\n"

        "Now, summarize the following text in bullet points, each on a new line:\n\n"
        f"{text}\n\n"
        "Summary:"
    )
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert research assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return "Error occurred while generating summary."

def generate_few_shot_prompt(context, question):
    prompt = (
        "You are a research assistant capable of answering questions based on academic papers or provided research contexts. "
        "Your task is to provide clear, concise, and accurate answers to specific questions by analyzing the context given. "
        "Use evidence and details from the context to support your answers.\n\n"
        
        "Here are some examples of how to answer questions based on a given context:\n\n"
        
        "Context: 'Exploring AI in Healthcare: A Review'\n"
        "Question: What are the main applications of AI in healthcare according to the paper?\n"
        "Answer: The main applications of AI in healthcare, as highlighted in the paper, include diagnostics, personalized treatment, and patient monitoring. "
        "These applications aim to improve accuracy in medical procedures and tailor treatments to individual patient needs.\n\n"
        
        "Context: 'Natural Language Processing in Financial Services'\n"
        "Question: What challenges are associated with the use of NLP in financial services?\n"
        "Answer: The challenges associated with the use of NLP in financial services include the need for high-quality data and the accuracy of algorithms. "
        "The paper emphasizes that poor data quality can lead to incorrect predictions, and there is also a concern about the interpretability of complex models.\n\n"
        
        "Now, given the following context and question, provide an accurate and detailed answer:\n\n"
        f"Context: {context}\n"
        f"Question: {question}\n"
        "Answer:"
    )
    return prompt

def summarize_text_with_gpt(text, model):
    return summarize_text(text)

def answer_question_with_gpt(context, question, model):
    prompt = generate_few_shot_prompt(context, question)
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are an expert research assistant."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    return response['choices'][0]['message']['content']


###BERT
def summarize_text_with_t5(text):
    input_text = f"summarize: {text}"
    inputs = summarization_tokenizer.encode(input_text, return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = summarization_model.generate(inputs, max_length=512, min_length=100, num_beams=4, early_stopping=True)
    summary = summarization_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

def answer_question_with_bert(context, question):
    inputs = qa_tokenizer.encode_plus(question, context, return_tensors="pt", truncation=True, max_length=512)
    input_ids = inputs["input_ids"].tolist()[0]
    
    # Ensure that input_ids are not too long
    if len(input_ids) > 512:
        input_ids = input_ids[-512:]  # Truncate to the last 512 tokens

    with torch.no_grad():
        outputs = qa_model(**inputs)
    
    answer_start = torch.argmax(outputs.start_logits)
    answer_end = torch.argmax(outputs.end_logits) + 1
    answer = qa_tokenizer.convert_tokens_to_string(qa_tokenizer.convert_ids_to_tokens(input_ids[answer_start:answer_end]))

    # Handle cases where BERT may return an incomplete or empty answer
    if answer.strip() == "":
        answer = "No answer could be found based on the provided context."
    
    return answer

@app.route('/upload', methods=['POST'])
def upload_file():
    model_selection = request.form.get('model')
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    upload_folder = 'uploads/current_upload'
    if os.path.exists(upload_folder):
        for root, dirs, files in os.walk(upload_folder, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))
    os.makedirs(upload_folder, exist_ok=True)

    if file.filename.lower().endswith('.pdf'):
        file_path = os.path.join(upload_folder, secure_filename(file.filename))
        file.save(file_path)
        text = extract_text_from_pdf(file_path)
    elif file.filename.lower().endswith('.docx'):
        file_path = os.path.join(upload_folder, secure_filename(file.filename))
        file.save(file_path)
        text = extract_text_from_docx(file_path)
    else:
        return jsonify({"error": "Allowed file types are pdf and docx"}), 400

    if 'Error reading' in text:
        return jsonify({"error": text}), 400

    if model_selection == 'gpt-3.5-turbo':
        summary = summarize_text_with_gpt(text, "gpt-3.5-turbo")
    elif model_selection == 'gpt-4o':
        summary = summarize_text_with_gpt(text, "gpt-4o")
    elif model_selection == 't5-base':
        summary = summarize_text_with_t5(text)
    else:
        return jsonify({"error": "Invalid model selection"}), 400

    return jsonify({
        "file": file.filename,
        "summary": summary
    }), 200
    
@app.route('/answer', methods=['POST'])
def answer():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    context = data.get('context')
    question = data.get('question')
    model_selection = data.get('model')

    missing_fields = []
    if not context:
        missing_fields.append("context")
    if not question:
        missing_fields.append("question")
    if not model_selection:
        missing_fields.append("model")

    if missing_fields:
        return jsonify({"error": "Missing required fields", "missing": missing_fields}), 400

    try:
        if model_selection == 'gpt-3.5-turbo':
            answer = answer_question_with_gpt(context, question, "gpt-3.5-turbo")
        elif model_selection == 'gpt-4o':
            answer = answer_question_with_gpt(context, question, "gpt-4o")
        elif model_selection == 't5-base':
            answer = answer_question_with_bert(context, question)
        else:
            return jsonify({"error": "Invalid model selection"}), 400

        return jsonify({
            "context": context,
            "question": question,
            "answer": answer
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)
