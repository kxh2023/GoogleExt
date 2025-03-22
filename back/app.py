from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import logging
import json
import time
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask and SocketIO
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory document storage
class DocumentState:
    def __init__(self, document_id: str):
        self.document_id = document_id
        self.content = ""
        self.version = 0
        self.last_update_time = time.time()
        self.cursor_positions = {}  # Map of client_id -> cursor position
        self.clients = set()  # Set of connected client IDs
        
    def update_from_full_sync(self, content: str, version: int, client_id: str, cursor_position: int) -> None:
        """Update document from a full sync message"""
        self.content = content
        self.version = version
        self.last_update_time = time.time()
        self.cursor_positions[client_id] = cursor_position
        logger.info(f"Full sync for doc {self.document_id} - Version: {version}, Size: {len(content)} chars")
        
    def apply_changes(self, changes: List[Dict[str, Any]], version: int, client_id: str, cursor_position: int) -> bool:
        """Apply a set of changes to the document"""
        if version <= self.version:
            logger.warning(f"Received outdated version {version} (current is {self.version})")
            return False
            
        try:
            # Apply each change sequentially
            for change in changes:
                from_pos = change.get('from', 0)
                to_pos = change.get('to', 0)
                insert_text = change.get('insert', '')
                
                # Validate positions
                if from_pos < 0 or to_pos > len(self.content) or from_pos > to_pos:
                    logger.error(f"Invalid change positions: {from_pos} to {to_pos}, content length: {len(self.content)}")
                    continue
                
                # Apply the change
                self.content = self.content[:from_pos] + insert_text + self.content[to_pos:]
                
            self.version = version
            self.last_update_time = time.time()
            self.cursor_positions[client_id] = cursor_position
            
            logger.info(f"Applied {len(changes)} changes to doc {self.document_id} - New version: {version}")
            return True
            
        except Exception as e:
            logger.error(f"Error applying changes: {e}")
            return False
            
    def update_cursor(self, client_id: str, cursor_position: int) -> None:
        """Update the cursor position for a client"""
        self.cursor_positions[client_id] = cursor_position
        self.last_update_time = time.time()
        
    def add_client(self, client_id: str) -> None:
        """Add a client to this document"""
        self.clients.add(client_id)
        logger.info(f"Client {client_id} joined document {self.document_id} ({len(self.clients)} clients total)")
        
    def remove_client(self, client_id: str) -> None:
        """Remove a client from this document"""
        if client_id in self.clients:
            self.clients.remove(client_id)
            if client_id in self.cursor_positions:
                del self.cursor_positions[client_id]
            logger.info(f"Client {client_id} left document {self.document_id} ({len(self.clients)} clients remaining)")
            
    def get_suggested_completions(self, position: int, line_number: int, line_text: str, prefix: str) -> List[Dict[str, Any]]:
        """Generate autocomplete suggestions based on document content and context"""
        # For a real implementation, this would use a language model or similar
        # This is a simple example implementation
        
        # Sample completions based on document content
        suggestions = []
        
        # Common LaTeX commands as fallback
        fallback_suggestions = [
            {'text': '\\begin{document}', 'displayText': '\\begin{document}...\\end{document}'},
            {'text': '\\section{', 'displayText': '\\section{}'},
            {'text': '\\subsection{', 'displayText': '\\subsection{}'},
            {'text': '\\cite{', 'displayText': '\\cite{}'},
            {'text': '\\ref{', 'displayText': '\\ref{}'},
            {'text': '\\textbf{', 'displayText': '\\textbf{}'},
            {'text': '\\textit{', 'displayText': '\\textit{}'},
        ]
        
        # Extract words from document for more contextual suggestions
        if len(self.content) > 0:
            import re
            words = re.findall(r'\\[a-zA-Z]+\{[^\}]*\}', self.content)
            unique_words = list(set(words))[:10]  # Limit to 10 unique matches
            
            for word in unique_words:
                suggestions.append({
                    'text': word,
                    'displayText': word,
                    'source': 'document'
                })
        
        # Add fallbacks if we don't have enough
        if len(suggestions) < 5:
            for sugg in fallback_suggestions:
                if prefix and prefix[-1] == '\\':
                    suggestions.append({
                        'text': sugg['text'][1:],  # Remove backslash since it's already in prefix
                        'displayText': sugg['displayText'],
                        'source': 'fallback'
                    })
                else:
                    suggestions.append({
                        'text': sugg['text'], 
                        'displayText': sugg['displayText'],
                        'source': 'fallback'
                    })
        
        return suggestions

# Storage for documents
documents: Dict[str, DocumentState] = {}

def get_document(document_id: str) -> DocumentState:
    """Get or create a document state"""
    if document_id not in documents:
        documents[document_id] = DocumentState(document_id)
    return documents[document_id]

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    client_id = request.sid
    logger.info(f"Client connected: {client_id}")
    
@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    client_id = request.sid
    
    # Remove client from all documents
    for doc in documents.values():
        doc.remove_client(client_id)
        
    logger.info(f"Client disconnected: {client_id}")

@socketio.on('register')
def handle_register(data):
    """Register client with a document"""
    client_id = request.sid
    document_id = data.get('documentId')
    
    if not document_id:
        logger.error("No document ID provided for registration")
        return
    
    # Add client to document
    document = get_document(document_id)
    document.add_client(client_id)
    
    # Join room for this document
    join_room(document_id)
    
    logger.info(f"Client {client_id} registered with document {document_id}")

@socketio.on('fullSync')
def handle_full_sync(data):
    """Handle full document sync"""
    client_id = request.sid
    document_id = data.get('documentId')
    content = data.get('content', '')
    version = data.get('version', 0)
    cursor_position = data.get('cursorPosition', 0)
    
    if not document_id:
        logger.error("No document ID provided for full sync")
        return
    
    # Update document state
    document = get_document(document_id)
    document.update_from_full_sync(content, version, client_id, cursor_position)
    
    logger.info(f"Full sync from client {client_id} for document {document_id}")

@socketio.on('changes')
def handle_changes(data):
    """Handle incremental changes"""
    client_id = request.sid
    document_id = data.get('documentId')
    changes = data.get('changes', [])
    version = data.get('version', 0)
    cursor_position = data.get('cursorPosition', 0)
    
    if not document_id:
        logger.error("No document ID provided for changes")
        return
    
    # Apply changes to document
    document = get_document(document_id)
    success = document.apply_changes(changes, version, client_id, cursor_position)
    
    if not success:
        # Request a full sync if changes couldn't be applied
        emit('requestFullSync', {
            'reason': 'Version conflict or invalid changes'
        })
        
@socketio.on('heartbeat')
def handle_heartbeat(data):
    """Handle heartbeat with cursor update"""
    client_id = request.sid
    document_id = data.get('documentId')
    cursor_position = data.get('cursorPosition', 0)
    
    if not document_id:
        return
    
    # Update cursor position
    document = get_document(document_id)
    document.update_cursor(client_id, cursor_position)

@socketio.on('requestSuggestion')
def handle_suggestion_request(data):
    """Handle request for autocomplete suggestions"""
    client_id = request.sid
    document_id = data.get('documentId')
    position = data.get('position', 0)
    line_number = data.get('lineNumber', 0)
    line_text = data.get('lineText', '')
    prefix = data.get('prefix', '')
    
    if not document_id:
        logger.error("No document ID provided for suggestion request")
        return
    
    # Get document and generate suggestions
    document = get_document(document_id)
    suggestions = document.get_suggested_completions(position, line_number, line_text, prefix)
    
    # Send suggestions back to client
    emit('suggestion', {
        'suggestions': suggestions,
        'position': position,
        'prefix': prefix
    })
    
    logger.info(f"Sent {len(suggestions)} suggestions to client {client_id}")

# Main application routes
@app.route('/')
def index():
    """Simple status endpoint"""
    return {
        'status': 'running',
        'documents': len(documents),
        'timestamp': time.time()
    }

@app.route('/stats')
def stats():
    """Provide statistics on documents"""
    result = {
        'document_count': len(documents),
        'documents': {}
    }
    
    for doc_id, doc in documents.items():
        result['documents'][doc_id] = {
            'version': doc.version,
            'size': len(doc.content),
            'clients': len(doc.clients),
            'last_update': doc.last_update_time
        }
    
    return result

if __name__ == '__main__':
    logger.info("Starting editor sync backend service")
    socketio.run(app, host='0.0.0.0', port=5002, debug=True, allow_unsafe_werkzeug=True)