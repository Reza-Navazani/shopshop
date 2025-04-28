# Dynamic Text Boxes Application

This project is a full-stack web application that allows users to send messages to a backend powered by a GitHub LLM (Large Language Model) service, which responds with dynamic text boxes displayed in the frontend UI.

## Project Structure

- `dynamic-server/` — Python Flask backend API that connects to a GitHub LLM and updates the UI data.
- `dynamic-ui/` — React + TypeScript + Vite frontend that displays dynamic text boxes and allows user input.

---

## Backend: dynamic-server

### Features
- Exposes a `/send-message` API endpoint to receive user messages.
- Forwards messages to a GitHub LLM service and saves the response as a JSON file for the frontend.
- Written in Python 3.9+ using Flask and Azure AI SDK.

### Setup
1. **Python Environment**
   - Ensure Python 3.9 or later is installed.
   - (Optional) Create and activate a virtual environment:
     ```bash
     python -m venv myenv
     # On Windows:
     myenv\Scripts\activate
     ```
2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure Environment**
   - Edit `config.py` or set environment variables for your GitHub LLM endpoint, model, and token if needed.

### Running the Server
```bash
python main.py
```
- The server will start on `http://localhost:5000`.

---

## Frontend: dynamic-ui

### Features
- Built with React, TypeScript, and Vite.
- Fetches and displays dynamic text boxes from the backend.
- Allows users to send messages, which update the displayed boxes.
- Uses Tailwind CSS for styling.

### Setup
1. **Install Node.js** (v18+ recommended)
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start the development server**
   ```bash
   npm run dev
   ```
- The app will be available at `http://localhost:5173` by default.

### Build for Production
```bash
npm run build
```

---

## How It Works
1. User enters a message in the frontend UI.
2. The message is sent to the backend (`/send-message`).
3. The backend queries the GitHub LLM and writes the response to `dynamic-ui/public/boxes.json`.
4. The frontend polls this JSON file and updates the displayed boxes in real time.

---

## License
MIT or your preferred license.
